//change to "modlib" when charging on serv
import * as modlib from "./modlib"
//comment out when charging to serv
import * as mod from "./types/mod/index";
//usefull const for flag ui widget
const colorAlpha = 0.8
const insideAlpha = 0.9
//Color Vector
const blueColor = mod.CreateVector(0.439, 0.922, 1)
const darkBlueColor = mod.CreateVector(0.075, 0.184, 0.247)
const grayColor = mod.CreateVector(0.212, 0.224, 0.235)
const redColor = mod.CreateVector(1, 0.514, 0.38)
const darkRedColor = mod.CreateVector(0.251, 0.094, 0.067)
const blackColor = mod.CreateVector(0.031, 0.031, 0.031)
const whiteColor = mod.CreateVector(1,1,1)
const whiteToBlue16Step = mod.Divide(mod.Subtract(blueColor, whiteColor), 16)
const whiteToRed16Step = mod.Divide(mod.Subtract(redColor, whiteColor), 16)
//Global Variable
const isGameModeReady = mod.GlobalVariable(1)
const newFlagBlinking = mod.GlobalVariable(9)
const isFlagBlinking = mod.GlobalVariable(8)
const isBlinkRunning = mod.GlobalVariable(3)
const timer = mod.GlobalVariable(2)
const natoFlagsUi = mod.GlobalVariable(4)
const paxFlagsUi = mod.GlobalVariable(5)
const flagsOwner = mod.GlobalVariable(6)
const uiAnchors = mod.GlobalVariable(7)
const nb_flag = mod.GlobalVariable(10)
const scoreWidgetsNato = mod.GlobalVariable(11)
const scoreWidgetsPax = mod.GlobalVariable(12)
//PerObjectVariable
function natoPlayersOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 1)}
function paxPlayersOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 2)}
function flagOfCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 3)}
function teamCapturingCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 4)}
function oldCaptureStepCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 5)}
function onFlagPlayerWidgets(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 1)}
function playerUiAnchor(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 2)}
function playerIsOnFlag(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 4)}
function playerWasInjuredOnflag(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 3)}
//Enum
enum Team {
    Neutral,
    Nato,
    Pax
}
//Offset ID
const capturePointOffset = 200
//Setup
export function OnGameModeStarted(): void {
    const numberOfFlag = mod.CountOf(mod.AllCapturePoints())
    mod.SetVariable(nb_flag, numberOfFlag)
    let flagsOwnerArray = mod.EmptyArray()
    let isFlagBlinkingArray = mod.EmptyArray()
    for(let x = 0; x < numberOfFlag; x += 1) {
        flagsOwnerArray = mod.AppendToArray(flagsOwnerArray, Team.Neutral)
    }
    for(let x = 0; x < numberOfFlag; x += 1) {
            isFlagBlinkingArray = mod.AppendToArray(isFlagBlinkingArray, false) 
    }
    mod.SetVariable(timer, 0)
    mod.SetVariable(isFlagBlinking, isFlagBlinkingArray)
    mod.SetVariable(flagsOwner, flagsOwnerArray)
    mod.SetVariable(newFlagBlinking, mod.EmptyArray())
    makeUiTeamAnchor()
    makeScoreUi()
    makeFlagUiLayer(numberOfFlag)
    mod.EnableGameModeObjective(mod.GetSector(300), true)
    for(let x = 0; x < mod.CountOf(mod.AllCapturePoints()); x += 1) {
        const capturePoint = mod.ValueInArray(mod.AllCapturePoints(), x)  
        const teamFlagOwner = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint))
        mod.SetVariable(flagOfCapturePoint(capturePoint), x)
        mod.SetVariable(natoPlayersOnCapturePoint(capturePoint), mod.EmptyArray())
        mod.SetVariable(paxPlayersOnCapturePoint(capturePoint), mod.EmptyArray())
        mod.EnableGameModeObjective(capturePoint, true)
        mod.EnableCapturePointDeploying(capturePoint, true)
        mod.SetCapturePointCapturingTime(capturePoint, 15)
        mod.SetCapturePointNeutralizationTime(capturePoint, 15)
        mod.SetMaxCaptureMultiplier(capturePoint, 2)
        mod.SetVariable(teamCapturingCapturePoint(capturePoint), teamFlagOwner)
        setFlagOwner(x, teamFlagOwner)
    }
    mod.SetVariable(isBlinkRunning, false)
    mod.SetVariable(isGameModeReady, 1)

}

 export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
    mod.SetVariable(teamCapturingCapturePoint(eventCapturePoint), mod.GetOwnerProgressTeam(eventCapturePoint))
 }

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    mod.SetVariable(playerIsOnFlag(eventPlayer), -1)
    mod.SetVariable(playerWasInjuredOnflag(eventPlayer), -1)
    makeUiAnchorPlayer(eventPlayer)
    makeOnFlagUiLayer(eventPlayer)
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void { 
    if(mod.IsSoldierClass(eventPlayer, mod.SoldierClass.Recon)) {
        mod.SetTeam(eventPlayer, mod.GetTeam(Team.Pax))
    }
}
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    setFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
    notifyOnFlagPlayersOfStateChange(eventCapturePoint)
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    setFlagBlink(flag, false);
    setFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
    notifyOnFlagPlayersOfStateChange(eventCapturePoint)
}

export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    mod.SetVariable(playerIsOnFlag(eventPlayer), flag)
    if(mod.GetObjId(mod.GetTeam(eventPlayer)) == Team.Nato) {
        mod.SetVariable(natoPlayersOnCapturePoint(eventCapturePoint), mod.AppendToArray(mod.GetVariable(natoPlayersOnCapturePoint(eventCapturePoint)) , eventPlayer))
    }
    else {
        mod.SetVariable(paxPlayersOnCapturePoint(eventCapturePoint), mod.AppendToArray(mod.GetVariable(paxPlayersOnCapturePoint(eventCapturePoint)) , eventPlayer))
    }
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const nbNatoPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(eventCapturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    const nbPaxPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(eventCapturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    notifyPlayersOfPopulationChangeOnFlag(eventCapturePoint)
    displayOnFlagLayer(eventPlayer, flag)
    if(mod.Not(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag))) {
        if(capturePointOwner == Team.Nato &&  nbPaxPlayersNotDown != 0) {
            setFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Pax &&  nbNatoPlayersNotDown != 0) {
            setFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Neutral && (nbNatoPlayersNotDown != 0 || nbPaxPlayersNotDown != 0)){
            setFlagBlink(flag, true)
        }
    }
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    const playerId = mod.GetObjId(eventPlayer)
    mod.SetVariable(playerIsOnFlag(eventPlayer), -1)
    if(mod.GetObjId(mod.GetTeam(eventPlayer)) == Team.Nato) {
        mod.SetVariable(natoPlayersOnCapturePoint(eventCapturePoint), modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(eventCapturePoint)) , (currentElement) => mod.GetObjId(currentElement) != playerId))
    }
    else {
        mod.SetVariable(paxPlayersOnCapturePoint(eventCapturePoint), modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(eventCapturePoint)) , (currentElement) => mod.GetObjId(currentElement) != playerId))
    }
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const nbNatoPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(eventCapturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    const nbPaxPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(eventCapturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    removeFromViewOnFlagLayer(eventPlayer)
    notifyPlayersOfPopulationChangeOnFlag(eventCapturePoint)
    if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
        if(capturePointOwner == Team.Nato &&  nbPaxPlayersNotDown == 0) {
            setFlagBlink(flag, false)
        }
        else if(capturePointOwner == Team.Pax &&  nbNatoPlayersNotDown == 0) {
            setFlagBlink(flag, false)
        }
        else if(nbNatoPlayersNotDown == 0 && nbPaxPlayersNotDown == 0){
            setFlagBlink(flag, false)
        }
    }
}
//main loop
export async function OngoingGlobal(): Promise<void> {
    
    await mod.Wait(0.05)
    await mod.SetVariable(timer, mod.GetVariable(timer) + 0.05)
    if(mod.GetVariable(isGameModeReady) == 1) {
       if(mod.Not(mod.GetVariable(isBlinkRunning))) {
           blink()
        }
    }

}
/*export async function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): Promise<void> {
    const oldCaptureStep = mod.GetVariable(oldCaptureStepCapturePoint(eventCapturePoint))
    if(oldCaptureStep != 1 && oldCaptureStep != 0) {
        const newCaptureState = mod.Floor(mod.GetCaptureProgress(eventCapturePoint) / 0.0625)

    }
}*/
export function OnPlayerDied(eventPlayer: mod.Player,eventOtherPlayer: mod.Player,eventDeathType: mod.DeathType,eventWeaponUnlock: mod.WeaponUnlock): void {
    removePlayerFromCapturePointIfNecessary(eventPlayer)
}
export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    const playerFlag = mod.GetVariable(playerIsOnFlag(eventPlayer)) 
    if(playerFlag != -1) {
        displayOnFlagLayer(eventPlayer, playerFlag)
    }
}
export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    const playerFlag = mod.GetVariable(playerIsOnFlag(eventPlayer))
    if(playerFlag != -1) {
        removeFromViewOnFlagLayer(eventPlayer)
        notifyPlayersOfPopulationChangeOnFlag(mod.ValueInArray(mod.AllCapturePoints(), playerFlag))
    }
}
function notifyOnFlagPlayersOfStateChange(capturePoint : mod.CapturePoint) {
    const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
    const natoPlayers = mod.GetVariable(natoPlayersOnCapturePoint(capturePoint))
    const paxPlayers = mod.GetVariable(paxPlayersOnCapturePoint(capturePoint))
    for(let x = 0; x < mod.CountOf(natoPlayers); x += 1) {
        const currPlayer = mod.ValueInArray(natoPlayers, x)
        if(mod.Not(mod.GetSoldierState(currPlayer, mod.SoldierStateBool.IsManDown))) {
            displayOnFlagLayer(currPlayer, flag)
        }
        
    }
    for(let x = 0; x < mod.CountOf(paxPlayers); x += 1) {
        const currPlayer = mod.ValueInArray(paxPlayers, x)
        if(mod.Not(mod.GetSoldierState(currPlayer, mod.SoldierStateBool.IsManDown))) {
            displayOnFlagLayer(currPlayer, flag)
        }
    }
}
function removePlayerFromCapturePointIfNecessary(player : mod.Player) : number{
    const playerFlag = mod.GetVariable(playerIsOnFlag(player))
    if(playerFlag != -1) {
        const playerId = mod.GetObjId(player)
        const capturePoints = mod.AllCapturePoints()
        const playerTeamId = mod.GetObjId(mod.GetTeam(player))
        const currCapturePoint = mod.ValueInArray(capturePoints, playerFlag)
            let capturePointPlayersArray = mod.EmptyArray()
            if(playerTeamId == Team.Nato) {
                capturePointPlayersArray = mod.GetVariable(natoPlayersOnCapturePoint(currCapturePoint))
            }
            else {
                capturePointPlayersArray = mod.GetVariable(paxPlayersOnCapturePoint(currCapturePoint))
            }
            if(modlib.IsTrueForAny(capturePointPlayersArray, (other) => mod.GetObjId(other) == playerId)) {
                capturePointPlayersArray = modlib.FilteredArray(capturePointPlayersArray, (other) => mod.GetObjId(other) != playerId)
                if(playerTeamId == Team.Nato) {
                    mod.SetVariable(natoPlayersOnCapturePoint(currCapturePoint), capturePointPlayersArray)
                }
                else {
                    mod.SetVariable(paxPlayersOnCapturePoint(currCapturePoint), capturePointPlayersArray)
                }
                const flag = mod.GetVariable(flagOfCapturePoint(currCapturePoint))
                const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
                const nbNatoPlayers = mod.CountOf(mod.GetVariable(natoPlayersOnCapturePoint(currCapturePoint)))
                const nbPaxPlayers = mod.CountOf(mod.GetVariable(paxPlayersOnCapturePoint(currCapturePoint)))
                if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
                    if(capturePointOwner == Team.Nato &&  nbPaxPlayers == 0) {
                        setFlagBlink(flag, false)
                    }
                    else if(capturePointOwner == Team.Pax &&  nbNatoPlayers == 0) {
                        setFlagBlink(flag, false)
                    }
                    else if(nbNatoPlayers == 0 && nbPaxPlayers == 0){
                        setFlagBlink(flag, false)
                    }
                }
                removeFromViewOnFlagLayer(player)
                return flag
            }
        }
    return -1
}
//Make asumption that you do not change to the same team
function setFlagOwner(flag: number, team : number) {
    const oldFlagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const natoFlagsWidgets = mod.GetVariable(natoFlagsUi)
    const paxFlagsWidgets = mod.GetVariable(paxFlagsUi)
    const numberOfFlag = mod.GetVariable(nb_flag)
    const neutralSection = 0
    const allySection = numberOfFlag * 3
    const enemySection = (numberOfFlag * 3) * 2
    const flagOffset = flag * 3
    if(oldFlagOwner == Team.Neutral) {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, neutralSection + flagOffset + x), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, neutralSection + flagOffset + x), false)
        }
    }
    else if(oldFlagOwner == Team.Nato) {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, allySection + flagOffset + x), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, enemySection + flagOffset + x), false)
        }
    }
    else {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, enemySection + flagOffset + x), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, allySection + flagOffset + x), false)
        }
    }
    if(team == Team.Neutral) {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, neutralSection + flagOffset + x), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, neutralSection + flagOffset + x), true)
        }
    }
    else if(team == Team.Nato) {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, allySection + flagOffset + x), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, enemySection + flagOffset + x), true)
        }
    }
    else {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, enemySection + flagOffset + x), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, allySection + flagOffset + x), true)
        }
    }
    mod.SetVariableAtIndex(flagsOwner, flag, team)
    if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
        setFlagBlink(flag, false)
        setFlagBlink(flag, true)
    }
}
function setFlagBlink(flag : number, bool: boolean) {
    if(bool) {
        mod.SetVariableAtIndex(isFlagBlinking, flag, true)
    }
    else {
            const ownerArray = mod.GetVariable(flagsOwner)
            const natoFlagsWidgets = mod.GetVariable(natoFlagsUi)
            const paxFlagsWidgets = mod.GetVariable(paxFlagsUi)
            const owner = mod.ValueInArray(ownerArray, flag)
            const nbFlags = mod.GetVariable(nb_flag)
            const neutralSection = 0
            const allySection = nbFlags * 3
            const enemySection = (nbFlags * 3) * 2
            const flagOffset = flag * 3
            let paxLayerUpdate = neutralSection
            let natoLayerUpdate = neutralSection
            if(owner == Team.Pax) {
                paxLayerUpdate = allySection
                natoLayerUpdate = enemySection
                mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), colorAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), colorAlpha)
            }
            else if(owner == Team.Nato) {
                paxLayerUpdate = enemySection
                natoLayerUpdate = allySection
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), colorAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), colorAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), colorAlpha)
            }
            else {
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), colorAlpha)
                mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideAlpha)
                mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), colorAlpha)
            }
            mod.SetVariableAtIndex(isFlagBlinking, flag, false)
        }
    }

//HARD LIMIT 9 FLAG BLINKING AT THE SAME TIME START LAG (Only on the UI)
async function blink() {
    mod.SetVariable(isBlinkRunning, true)
    const natoFlagsWidgets = mod.GetVariable(natoFlagsUi)
    const paxFlagsWidgets = mod.GetVariable(paxFlagsUi)
    const nbFlags = mod.GetVariable(nb_flag)
    const neutralSection = 0
    const allySection = nbFlags * 3
    const enemySection = (nbFlags * 3) * 2
    while(true) {
        const ownerArray = mod.GetVariable(flagsOwner)
        const blinkArray = mod.GetVariable(isFlagBlinking)
        const sin = mod.SineFromRadians(mod.Multiply(mod.GetVariable(timer) , 2))
        const outlineAlpha = mod.Add(0.55, mod.Multiply(sin, 0.25));
        const insideCalcAlpha = mod.Add(0.6, mod.Multiply(sin, 0.3));
        for(let x = 0 ; x < nbFlags; x += 1) {
            if(mod.ValueInArray(blinkArray, x)) {
                const owner = mod.ValueInArray(ownerArray, x)
                const flagOffset = x * 3
                let paxLayerUpdate = neutralSection
                let natoLayerUpdate = neutralSection
                if(owner == Team.Pax) {
                    paxLayerUpdate = allySection
                    natoLayerUpdate = enemySection
                    mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), outlineAlpha)
                }
                else if(owner == Team.Nato) {
                    paxLayerUpdate = enemySection
                    natoLayerUpdate = allySection
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), outlineAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), outlineAlpha)
                }
                else {
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(paxFlagsWidgets, paxLayerUpdate + flagOffset + 2), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset), outlineAlpha)
                    mod.SetUIWidgetBgAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 1), insideCalcAlpha)
                    mod.SetUITextAlpha(mod.ValueInArray(natoFlagsWidgets, natoLayerUpdate + flagOffset + 2), outlineAlpha)
                }
            }
        }
        await mod.Wait(0.05)
    }  
}
            
 

    function updatePlayerOnFlagLayer(player : mod.Player, nbPaxPlayers: number, nbNatoPlayer: number, flag: number) {
        const allKeys = Object.keys(mod.stringkeys)
        const flagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
        const flagLetter = allKeys[flag]
        const playerOnFlagWidget = mod.GetVariable(onFlagPlayerWidgets(player))
        const totalPlayerOnFlag = nbPaxPlayers + nbNatoPlayer
        const lineSizePerPlayer = 89 / totalPlayerOnFlag
        const playerTeamId = mod.GetObjId(mod.GetTeam(player))
        let nbAllyPlayers = nbNatoPlayer
        let nbEnemyPlayers = nbPaxPlayers
        if(playerTeamId == Team.Pax) {
            nbAllyPlayers = nbPaxPlayers
            nbEnemyPlayers = nbNatoPlayer
        }
        if(nbEnemyPlayers == 0) {
             mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), false)
        }
        else {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), true)
        }
        mod.SetUIWidgetSize(mod.ValueInArray(playerOnFlagWidget, 14), mod.CreateVector(lineSizePerPlayer * nbAllyPlayers,6,0))
        mod.SetUIWidgetSize(mod.ValueInArray(playerOnFlagWidget, 15), mod.CreateVector(lineSizePerPlayer * nbEnemyPlayers,6,0))
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 16), mod.Message(nbAllyPlayers))
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 17), mod.Message(nbEnemyPlayers))
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 8), mod.Message(flagLetter))
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 12), mod.Message(flagLetter))
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 4), mod.Message(flagLetter))
        if(flagOwner == Team.Neutral) {
            mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.capturing))
        }
        else if(playerTeamId != flagOwner) {
            mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.capturing))
        }
        else {
            mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.defending))
        }
    }
    function notifyPlayersOfPopulationChangeOnFlag(capturePoint: mod.CapturePoint) {
        const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
        const natoPlayers = mod.GetVariable(natoPlayersOnCapturePoint(capturePoint))
        const paxPlayers = mod.GetVariable(paxPlayersOnCapturePoint(capturePoint))
        const nbNatoDownPlayers = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
        const nbPaxDownPlayers = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
        const nbNatoPlayers = mod.CountOf(natoPlayers)
        const nbPaxPlayers = mod.CountOf(paxPlayers)
        for(let x = 0; x < mod.CountOf(natoPlayers); x += 1) {
            const currPlayer = mod.ValueInArray(natoPlayers, x)
            updatePlayerOnFlagLayer(currPlayer, nbPaxPlayers - nbPaxDownPlayers, nbNatoPlayers - nbNatoDownPlayers, flag)
        }
        for(let x = 0; x < mod.CountOf(paxPlayers); x += 1) {
            const currPlayer = mod.ValueInArray(paxPlayers, x)
            updatePlayerOnFlagLayer(currPlayer, nbPaxPlayers - nbPaxDownPlayers, nbNatoPlayers - nbNatoDownPlayers, flag)
        }
    }
    function displayOnFlagLayer(player : mod.Player, flag: number) {
        const playerOnFlagWidget = mod.GetVariable(onFlagPlayerWidgets(player))
        const flagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
        const playerTeamId = mod.GetObjId(mod.GetTeam(player))
        mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 0), true)
        if(flagOwner == Team.Neutral) {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 1), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 5), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 9), false)
        }
        else if(playerTeamId != flagOwner) {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 1), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 5), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 9), true)
        }
        else {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 1), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 5), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 9), false)
        }
    }
        function removeFromViewOnFlagLayer(player : mod.Player) {
        const playerOnFlagWidget = mod.GetVariable(onFlagPlayerWidgets(player))
        mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 0), false)
    }
    //--------UI FONCTION---------------//
    function makeFlagUiLayer(nb_flag : number) {
        const neutralFlags = makeNeutralFlagUiLayer(nb_flag)
        const allyFlags = makeAllyFlagUiLayer(nb_flag)
        const enemyFlags = makeEnemyFlagUiLayer(nb_flag)
        const natoFlags = mod.AppendToArray(neutralFlags[0], mod.AppendToArray(allyFlags[0], enemyFlags[0]))
        const paxFlags = mod.AppendToArray(neutralFlags[1], mod.AppendToArray(allyFlags[1], enemyFlags[1]))
        mod.SetVariable(natoFlagsUi, natoFlags)
        mod.SetVariable(paxFlagsUi, paxFlags)
    }
    function makeAllyFlagUiLayer(nb_flag : number) {
        const allKeys = Object.keys(mod.stringkeys)
        const allyUiLayerName = mod.stringkeys.ally
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let teamId = Team.Nato
            let teamOwner = mod.GetTeam(teamId)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamId = Team.Pax
                teamOwner = mod.GetTeam(teamId)
            }
            const highestUiLayer = mod.ValueInArray(mod.GetVariable(uiAnchors), teamId)
            mod.AddUIContainer(allyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const allyUiLayer = mod.FindUIWidgetWithName(allyUiLayerName, highestUiLayer)
            for(let l = 0; l < nb_flag; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - ((nb_flag - 1) * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, allyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
                const baseIU = mod.FindUIWidgetWithName(baseUIName, allyUiLayer)
                mod.AddUIText(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 40, blueColor, colorAlpha, mod.UIAnchor.Center, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, baseIU))
                mod.AddUIText(mod.stringkeys.circle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 36, blackColor, insideAlpha, mod.UIAnchor.Center,teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.circle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, blueColor, colorAlpha, mod.UIAnchor.Center, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.letter, baseIU))
            }
            if(x == 0) {
                natoFlagsArray = flagsArray
            }
            else {
                paxFlagsArray = flagsArray
            }
        } 
        return [natoFlagsArray, paxFlagsArray]
    }
    function makeNeutralFlagUiLayer(nb_flag : number) {
        const allKeys = Object.keys(mod.stringkeys)
        const neutralUiLayerName = mod.stringkeys.neutral
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let teamId = Team.Nato
            let teamOwner = mod.GetTeam(teamId)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamId = Team.Pax
                teamOwner = mod.GetTeam(teamId)
            }
            const highestUiLayer = mod.ValueInArray(mod.GetVariable(uiAnchors), teamId)
            mod.AddUIContainer(neutralUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const neutralUiLayer = mod.FindUIWidgetWithName(neutralUiLayerName, highestUiLayer)
            for(let l = 0; l < nb_flag; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - ((nb_flag - 1) * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, neutralUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
                const baseIU = mod.FindUIWidgetWithName(baseUIName, neutralUiLayer)
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(33,33,0), mod.UIAnchor.Center, baseIU, true, 0, whiteColor, colorAlpha, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(30,30,0), mod.UIAnchor.Center, baseIU, true, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, whiteColor, colorAlpha, mod.UIAnchor.Center, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.letter, baseIU))
            }
            if(x == 0) {
                natoFlagsArray = flagsArray
            }
            else {
                paxFlagsArray = flagsArray
            }
        } 
        return [natoFlagsArray, paxFlagsArray]
    }
    function makeEnemyFlagUiLayer(nb_flag : number) : [mod.Array, mod.Array]{
        const allKeys = Object.keys(mod.stringkeys)
        const enemyUiLayerName = mod.stringkeys.enemy
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let teamId = Team.Nato
            let teamOwner = mod.GetTeam(teamId)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamId = Team.Pax
                teamOwner = mod.GetTeam(teamId)
            }
            const highestUiLayer = mod.ValueInArray(mod.GetVariable(uiAnchors), teamId)
            mod.AddUIContainer(enemyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const enemyUiLayer = mod.FindUIWidgetWithName(enemyUiLayerName, highestUiLayer)
            for(let l = 0; l < nb_flag; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - ((nb_flag - 1) * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, enemyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
                const baseIU = mod.FindUIWidgetWithName(baseUIName, enemyUiLayer)
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(33,33,0), mod.UIAnchor.Center, baseIU, false, 0, redColor, colorAlpha, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(30,30,0), mod.UIAnchor.Center, baseIU, false, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, redColor, colorAlpha, mod.UIAnchor.Center, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.letter, baseIU))
            }
            if(x == 0) {
                natoFlagsArray = flagsArray
            }
            else {
                paxFlagsArray = flagsArray
            }
        } 
        return [natoFlagsArray, paxFlagsArray]
    }
    function makeUiTeamAnchor() {
        mod.AddUIContainer(mod.stringkeys.natoFlags, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetTeam(Team.Nato))
        const highestUiLayerNato = mod.FindUIWidgetWithName(mod.stringkeys.natoFlags)
        mod.AddUIContainer(mod.stringkeys.paxFlags, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetTeam(Team.Pax))
        const highestUiLayerPax = mod.FindUIWidgetWithName(mod.stringkeys.paxFlags)
        mod.SetVariableAtIndex(uiAnchors, Team.Nato, highestUiLayerNato)
        mod.SetVariableAtIndex(uiAnchors, Team.Pax, highestUiLayerPax)
    }
    function makeScoreUi() {
        for(let x = 0; x < 2; x += 1) {
            let teamId = Team.Nato
            let teamOwner = mod.GetTeam(teamId)
            if(x != 0) {
                teamId = Team.Pax
                teamOwner = mod.GetTeam(teamId)
            }
            const highestUiLayer = mod.ValueInArray(mod.GetVariable(uiAnchors), teamId)
            mod.AddUIContainer(mod.stringkeys.score_line_ally, mod.CreateVector(-183,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            const scoreLineAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_line_ally)
            mod.AddUIContainer(mod.stringkeys.score_line_enemy, mod.CreateVector(3,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            const scoreLineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_line_enemy)

            mod.AddUIContainer(mod.stringkeys.score_backround_line_ally, mod.CreateVector(-183,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkBlueColor, 0.8, mod.UIBgFill.Blur, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_backround_line_enemy, mod.CreateVector(3,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkRedColor, 0.8, mod.UIBgFill.Blur, teamOwner)

            mod.AddUIContainer(mod.stringkeys.score_base_score_num_ally, mod.CreateVector(-276,54, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkBlueColor, 0.8, mod.UIBgFill.Blur, teamOwner)
            const scoreBaseAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_base_score_num_ally, highestUiLayer)
            mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, scoreBaseAlly, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(1000), 35, blueColor, 1, mod.UIAnchor.Center, teamOwner)
            const scoreTextAlly = mod.FindUIWidgetWithName(mod.stringkeys.letter, scoreBaseAlly)

            mod.AddUIContainer(mod.stringkeys.score_base_score_num_enemy, mod.CreateVector(191,54, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkRedColor, 0.8, mod.UIBgFill.Blur, teamOwner)
            const scoreBaseEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_base_score_num_enemy, highestUiLayer)
            mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, scoreBaseEnemy, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(1000), 35, redColor, 1, mod.UIAnchor.Center, teamOwner)
            const scoreTextEnemy = mod.FindUIWidgetWithName(mod.stringkeys.letter, scoreBaseEnemy)

            mod.AddUIContainer(mod.stringkeys.score_outline_ally, mod.CreateVector(0,0, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, scoreBaseAlly, true, 0, blueColor, 0, mod.UIBgFill.None, teamOwner)
            const scoreOutlineAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_outline_ally, scoreBaseAlly)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)

            mod.AddUIContainer(mod.stringkeys.score_outline_enemy, mod.CreateVector(0,0, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, scoreBaseEnemy, true, 0, redColor, 0, mod.UIBgFill.None, teamOwner)
            const scoreOutlineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_outline_enemy, scoreBaseEnemy)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
            
            const widgetsArray = mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.EmptyArray(), scoreLineAlly), scoreLineEnemy), scoreTextAlly), scoreTextEnemy), scoreOutlineAlly), scoreOutlineEnemy)
            
            if(teamId == Team.Nato) {
                mod.SetVariable(scoreWidgetsNato, widgetsArray)
            }
            else {
                mod.SetVariable(scoreWidgetsPax, widgetsArray)
            }
        }
    }
function makeUiAnchorPlayer(player: mod.Player) {
    const allKeys = Object.keys(mod.stringkeys)
    const playerId = mod.GetObjId(player)
    const keyId = playerId + 26
    mod.AddUIContainer(allKeys[keyId], mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.None, player)
    const highestUiLayer = mod.FindUIWidgetWithName(allKeys[keyId])
    mod.SetVariable(playerUiAnchor(player), highestUiLayer)
}
function makeOnFlagUiLayer(player : mod.Player) {
    const anchor = mod.GetVariable(playerUiAnchor(player))
    mod.AddUIContainer(mod.stringkeys.on_flag_layer, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, anchor, false, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.None, player)
    const highestUiLayer = mod.FindUIWidgetWithName(mod.stringkeys.on_flag_layer, anchor)

    // --- Ally Flag ---
    const allyUiLayerName = mod.stringkeys.ally
    mod.AddUIContainer(allyUiLayerName, mod.CreateVector(0,200,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, false, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, player)
    const allyUiLayer = mod.FindUIWidgetWithName(allyUiLayerName, highestUiLayer)
    
    mod.AddUIText(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, allyUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 67, blueColor, colorAlpha, mod.UIAnchor.Center, player)
    const allyOutline = mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, allyUiLayer)
    
    mod.AddUIText(mod.stringkeys.circle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, allyUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 60, blackColor, insideAlpha, mod.UIAnchor.Center,player)
    const allyInside = mod.FindUIWidgetWithName(mod.stringkeys.circle_inside, allyUiLayer)
    
    mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, allyUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.A), 28, blueColor, colorAlpha, mod.UIAnchor.Center, player)
    const letterAlly = mod.FindUIWidgetWithName(mod.stringkeys.letter, allyUiLayer)

    // --- Neutral Flag ---
    const neutralUiLayerName = mod.stringkeys.neutral
    mod.AddUIContainer(neutralUiLayerName, mod.CreateVector(0,200,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, player)
    const neutralUiLayer = mod.FindUIWidgetWithName(neutralUiLayerName, highestUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(54,54,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, whiteColor, colorAlpha, mod.UIBgFill.Solid, player)
    const neutralOutline = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, neutralUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(49,49,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, player)
    const neutralInside = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, neutralUiLayer)
    
    mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.A), 28, whiteColor, colorAlpha, mod.UIAnchor.Center, player)
    const letterNeutral = mod.FindUIWidgetWithName(mod.stringkeys.letter, neutralUiLayer)

    // --- Enemy Flag ---
    const enemyUiLayerName = mod.stringkeys.enemy
    mod.AddUIContainer(enemyUiLayerName, mod.CreateVector(0,200,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, false, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, player)
    const enemyUiLayer = mod.FindUIWidgetWithName(enemyUiLayerName, highestUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(54,54,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, redColor, colorAlpha, mod.UIBgFill.Solid, player)
    const enemyOutline = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, enemyUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(49,49,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, player)
    const enemyInside = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, enemyUiLayer)
    
    mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.A), 28, redColor, colorAlpha, mod.UIAnchor.Center, player)
    const letterEnemy = mod.FindUIWidgetWithName(mod.stringkeys.letter, enemyUiLayer)

    // --- Contestation Logic ---
    mod.AddUIContainer(mod.stringkeys.contest_line, mod.CreateVector(0,238, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0, blueColor, 1, mod.UIBgFill.None, player)
    const contestLine = mod.FindUIWidgetWithName(mod.stringkeys.contest_line, highestUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.contest_line_ally, mod.CreateVector(0,0, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopLeft, contestLine, true, 0, blueColor, 1, mod.UIBgFill.Solid, player)
    const contestLineAlly = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_ally, contestLine)
    
    mod.AddUIContainer(mod.stringkeys.contest_line_enemy, mod.CreateVector(0,0, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopRight, contestLine, true, 0, redColor, 1, mod.UIBgFill.Solid, player)
    const contestLineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_enemy, contestLine)
    
    mod.AddUIText(mod.stringkeys.contest_line_num_ally, mod.CreateVector(-13,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.CenterLeft, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(2), 18, blueColor, 0.6, mod.UIAnchor.Center, player)
    const contestNumAlly = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_num_ally, contestLine)
    
    mod.AddUIText(mod.stringkeys.contest_line_num_enemy, mod.CreateVector(-13,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.CenterRight, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(2), 18, redColor, 0.6, mod.UIAnchor.Center, player)
    const contestNumEnemy = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_num_enemy, contestLine)
    
    mod.AddUIText(mod.stringkeys.capture_point_msg, mod.CreateVector(0,-13, 0), mod.CreateVector(0,0,0), mod.UIAnchor.BottomCenter, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.defending), 18, whiteColor, 0.6, mod.UIAnchor.Center, player)
    const capturePointMsg = mod.FindUIWidgetWithName(mod.stringkeys.capture_point_msg, contestLine)

    // --- Array Compilation ---
    // Added: allyOutline, allyInside, neutralOutline, neutralInside, enemyOutline, enemyInside
    let widgetsArray = mod.EmptyArray()
    widgetsArray = mod.AppendToArray(widgetsArray, highestUiLayer) //0
    widgetsArray = mod.AppendToArray(widgetsArray, allyUiLayer) //1
    widgetsArray = mod.AppendToArray(widgetsArray, allyOutline) //2
    widgetsArray = mod.AppendToArray(widgetsArray, allyInside) // 3
    widgetsArray = mod.AppendToArray(widgetsArray, letterAlly) // 4
    widgetsArray = mod.AppendToArray(widgetsArray, neutralUiLayer) // 5
    widgetsArray = mod.AppendToArray(widgetsArray, neutralOutline) // 6
    widgetsArray = mod.AppendToArray(widgetsArray, neutralInside)// 7
    widgetsArray = mod.AppendToArray(widgetsArray, letterNeutral) // 8
    widgetsArray = mod.AppendToArray(widgetsArray, enemyUiLayer) // 9
    widgetsArray = mod.AppendToArray(widgetsArray, enemyOutline) // 10
    widgetsArray = mod.AppendToArray(widgetsArray, enemyInside) //11
    widgetsArray = mod.AppendToArray(widgetsArray, letterEnemy) // 12
    widgetsArray = mod.AppendToArray(widgetsArray, contestLine) // 13
    widgetsArray = mod.AppendToArray(widgetsArray, contestLineAlly) // 14
    widgetsArray = mod.AppendToArray(widgetsArray, contestLineEnemy) // 15
    widgetsArray = mod.AppendToArray(widgetsArray, contestNumAlly) // 16
    widgetsArray = mod.AppendToArray(widgetsArray, contestNumEnemy) // 17
    widgetsArray = mod.AppendToArray(widgetsArray, capturePointMsg) // 18

    mod.SetVariable(onFlagPlayerWidgets(player), widgetsArray);
}


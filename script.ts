//change to "modlib" when charging on serv
import * as modlib from "./modlib"
//comment out when charging to serv
import * as mod from "./types/mod/index";






// ------START : Variable to play with------//
//score
const startScoreNato = 300
const startScorePax = 300
const ticketLostPerKill = 1
//bleedTimer (seconds)
const bleedTime50Percent = 5
const bleedTime75Percent = 2.5
const bleedTime100Percent = 1
//capturePoint (seconds)
const captureTime = 15
const neutralizationTime = 15
const maxMultiplier = 2
//----------END : Variable to play with-------------//









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

//Global Variable
const isGameModeReady = mod.GlobalVariable(1)
const newFlagBlinking = mod.GlobalVariable(9)
const isFlagBlinking = mod.GlobalVariable(8)
const isBlinkRunning = mod.GlobalVariable(3)
const timer = mod.GlobalVariable(2)
const flagsOwner = mod.GlobalVariable(6)
const uiAnchors = mod.GlobalVariable(7)
const nb_flag = mod.GlobalVariable(10)
const capturePointSound = mod.GlobalVariable(13)
const bleedTimerTeam = mod.GlobalVariable(16)

//PerObjectVariable
//CapturePoint
function natoPlayersOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 1)}
function paxPlayersOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 2)}
function flagOfCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 3)}
function teamCapturingCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 4)}
function oldCaptureStepCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 5)}
function capturePointProgressMovement(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 6)}
function capturePointProgressDirection(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 7)}
//Player
function onFlagPlayerWidgets(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 1)}
function playerUiAnchor(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 2)}
function playerIsOnFlag(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 4)}
function playerWasInjuredOnflag(player : mod.Player) : mod.Variable {return mod.ObjectVariable(player, 3)}
//Team
function teamFlags(team : Team) : mod.Variable { return mod.ObjectVariable(mod.GetTeam(team), 1)}
function teamFlagsUi(team : Team) : mod.Variable { return mod.ObjectVariable(mod.GetTeam(team), 2)}
function teamScore(team : Team) : mod.Variable { return mod.ObjectVariable(mod.GetTeam(team), 3)}
function teamScoreUi(team : Team) : mod.Variable { return mod.ObjectVariable(mod.GetTeam(team), 4)}

//Enum
enum Team {
    Neutral,
    Nato,
    Pax
}
//Setup
export function OnGameModeStarted(): void {
    const numberOfFlag = mod.CountOf(mod.AllCapturePoints())
    mod.SetVariable(teamScore(Team.Nato), startScoreNato)
    mod.SetVariable(teamScore(Team.Pax), startScorePax)
    mod.LoadMusic(mod.MusicPackages.Core)
    mod.SetVariable(nb_flag, numberOfFlag)
    mod.SetVariable(bleedTimerTeam, Team.Neutral)
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
    mod.SetVariable(teamFlags(Team.Nato), 0)
    mod.SetVariable(teamFlags(Team.Pax), 0)
    MakeUiTeamAnchor()
    MakeScoreUi()
    MakeFlagUiLayer(numberOfFlag)
    SetupFlagAudio()
    mod.EnableGameModeObjective(mod.GetSector(300), true)
    for(let x = 0; x < mod.CountOf(mod.AllCapturePoints()); x += 1) {
        const capturePoint = mod.ValueInArray(mod.AllCapturePoints(), x)  
        const teamFlagOwner = mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint))
        mod.SetVariable(flagOfCapturePoint(capturePoint), x)
        mod.SetVariable(natoPlayersOnCapturePoint(capturePoint), mod.EmptyArray())
        mod.SetVariable(paxPlayersOnCapturePoint(capturePoint), mod.EmptyArray())
        mod.EnableGameModeObjective(capturePoint, true)
        mod.EnableCapturePointDeploying(capturePoint, true)
        mod.SetCapturePointCapturingTime(capturePoint, captureTime)
        mod.SetCapturePointNeutralizationTime(capturePoint, neutralizationTime)
        mod.SetMaxCaptureMultiplier(capturePoint, maxMultiplier)
        mod.SetVariable(teamCapturingCapturePoint(capturePoint), teamFlagOwner)
        mod.SetVariable(oldCaptureStepCapturePoint(capturePoint), mod.GetCaptureProgress(capturePoint))
        mod.SetVariable(capturePointProgressMovement(capturePoint), false)
        mod.SetVariable(capturePointProgressDirection(capturePoint), Team.Neutral)
        SetFlagOwner(x, teamFlagOwner)
        SoundOnFlag(capturePoint)
    }
    mod.ForceVehicleSpawnerSpawn(mod.GetVehicleSpawner(400))
    mod.ForceVehicleSpawnerSpawn(mod.GetVehicleSpawner(401))
    mod.SetVariable(isBlinkRunning, false)
    mod.SetVariable(isGameModeReady, 1)
    Blink()
    BleedTimer()
}
//------Capture Point Function------//
 export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
    mod.SetVariable(teamCapturingCapturePoint(eventCapturePoint), mod.GetOwnerProgressTeam(eventCapturePoint))
 }
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    if (mod.GetVariable(isGameModeReady) != 1) return
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    SetFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
    NotifyOnFlagPlayersOfStateChange(eventCapturePoint)
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    if (mod.GetVariable(isGameModeReady) != 1) return
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    SetFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
    SetFlagBlink(flag, false);
    NotifyOnFlagPlayersOfStateChange(eventCapturePoint)
}
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    const playerId = mod.GetObjId(eventPlayer)
    mod.SetVariable(playerIsOnFlag(eventPlayer), -1)
    const soundArray = mod.GetVariable(capturePointSound)
    const tickEnemySfx = mod.ValueInArray(soundArray, 1)
    const contestSfx = mod.ValueInArray(soundArray, 2)
    mod.StopSound(tickEnemySfx, eventPlayer)
    mod.StopSound(contestSfx, eventPlayer)
    if(mod.GetObjId(mod.GetTeam(eventPlayer)) == Team.Nato) {
        mod.SetVariable(natoPlayersOnCapturePoint(eventCapturePoint), modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(eventCapturePoint)) , (currentElement) => mod.GetObjId(currentElement) != playerId))
    }
    else {
        mod.SetVariable(paxPlayersOnCapturePoint(eventCapturePoint), modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(eventCapturePoint)) , (currentElement) => mod.GetObjId(currentElement) != playerId))
    }
    removeFromViewOnFlagLayer(eventPlayer)
    NotifyFlagOfPopulationChange(eventCapturePoint)
}

export async function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): Promise<void> {
    const oldCaptureStep = mod.GetVariable(oldCaptureStepCapturePoint(eventCapturePoint))
    const newCaptureState = mod.GetCaptureProgress(eventCapturePoint)
    if(oldCaptureStep != newCaptureState) {
        mod.SetVariable(oldCaptureStepCapturePoint(eventCapturePoint), newCaptureState)
        mod.SetVariable(capturePointProgressMovement(eventCapturePoint), true)
        NotifyPlayerUiOfFlagCaptureState(eventCapturePoint)
    }
    else {
        mod.SetVariable(capturePointProgressMovement(eventCapturePoint), false)
    }
    await mod.Wait(0.1)
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
    NotifyFlagOfPopulationChange(eventCapturePoint)
    NotifyPlayersOfPopulationChangeOnFlag(eventCapturePoint)
    DisplayOnFlagLayer(eventPlayer, flag)

}
//------Player Function--------//
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    mod.SetVariable(playerIsOnFlag(eventPlayer), -1)
    mod.SetVariable(playerWasInjuredOnflag(eventPlayer), -1)
    MakeUiAnchorPlayer(eventPlayer)
    MakeOnFlagUiLayer(eventPlayer)
}
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    if(mod.IsSoldierClass(eventPlayer, mod.SoldierClass.Recon)) {
        mod.SetTeam(eventPlayer, mod.GetTeam(Team.Pax))
    }
}
export function OnPlayerLeaveGame(eventNumber: number): void {
    if(mod.GetVariable(isGameModeReady) != 1) return
    RemoveInvalidPlayerFromFlag()
}
export function OnPlayerDied(eventPlayer: mod.Player,eventOtherPlayer: mod.Player,eventDeathType: mod.DeathType,eventWeaponUnlock: mod.WeaponUnlock): void {
    RemovePlayerFromCapturePointIfNecessary(eventPlayer)
}
export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    const playerFlag = mod.GetVariable(playerIsOnFlag(eventPlayer)) 
    if(playerFlag != -1) {
        DisplayOnFlagLayer(eventPlayer, playerFlag)
        NotifyFlagOfPopulationChange(mod.ValueInArray(mod.AllCapturePoints(), playerFlag))
    }
}
export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    const playerFlag = mod.GetVariable(playerIsOnFlag(eventPlayer))
    if(playerFlag != -1) {
        const soundArray = mod.GetVariable(capturePointSound)
        const tickEnemySfx = mod.ValueInArray(soundArray, 1)
        const contestSfx = mod.ValueInArray(soundArray, 2)
        mod.StopSound(tickEnemySfx, eventPlayer)
        mod.StopSound(contestSfx, eventPlayer)
        removeFromViewOnFlagLayer(eventPlayer)
        NotifyFlagOfPopulationChange(mod.ValueInArray(mod.AllCapturePoints(), playerFlag))
    }
}
export function OnPlayerEarnedKill( eventPlayer: mod.Player,eventOtherPlayer: mod.Player,eventDeathType: mod.DeathType,eventWeaponUnlock: mod.WeaponUnlock): void {
    if(mod.GetObjId(eventPlayer) != mod.GetObjId(eventOtherPlayer)) {
        AddToScore(-ticketLostPerKill, mod.GetObjId(mod.GetTeam(eventOtherPlayer)))
    }
}
//-----MAIN LOOP ------//
export async function OngoingGlobal(): Promise<void> {
    
    await mod.Wait(0.05)
    await mod.SetVariable(timer, mod.GetVariable(timer) + 0.05)

}
//-----OTHER LOOP----//
//May be reworked in a later day
async function BleedTimer() {
    const nbFlag = mod.GetVariable(nb_flag)
    const majority1 = mod.Floor(nbFlag - (nbFlag / 4))
    while(true) {
        const bleedTimerTeamV = mod.GetVariable(bleedTimerTeam)
        const bleedTimerTeamNbFlag = mod.GetVariable(bleedTimerTeam) ==  Team.Nato ? mod.GetVariable(teamFlags(Team.Nato)): mod.GetVariable(teamFlags(Team.Pax))
        
        if(bleedTimerTeamV == Team.Neutral) {
            await mod.Wait(0.5)
        }
        else {
            if(bleedTimerTeamNbFlag == nbFlag) {
                await mod.Wait(bleedTime100Percent)
            }
            else if(bleedTimerTeamNbFlag > majority1) {
                await mod.Wait(bleedTime75Percent)
            }
            else {
                await mod.Wait(bleedTime50Percent)
            }
            if(bleedTimerTeamV == mod.GetVariable(bleedTimerTeam)) {
                const teamBleeding = bleedTimerTeamV == Team.Nato ? Team.Pax : Team.Nato 
                AddToScore(-1, teamBleeding)
            }
        }
    }
}
//HARD LIMIT 9 FLAG BLINKING AT THE SAME TIME START LAG (Only on the UI) (Since optimized and limit not checked)
async function Blink() {
    mod.SetVariable(isBlinkRunning, true)
    const natoFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Nato))
    const paxFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Pax))
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
async function SoundOnFlag(capturePoint: mod.CapturePoint) {
    const soundArray = mod.GetVariable(capturePointSound);
    const tickAllySfx = mod.ValueInArray(soundArray, 0)
    const tickEnemySfx = mod.ValueInArray(soundArray, 1)
    const contestSfx = mod.ValueInArray(soundArray, 2)
    let wasContested = false
    let paxTeamWasCapturing = false
    let natoTeamWasCapturing = false
    let x = 0
    while(true) {
        let capturePointProgress = mod.GetCaptureProgress(capturePoint)
        const currentDirection = mod.GetVariable(capturePointProgressDirection(capturePoint))
        const isMoving = mod.GetVariable(capturePointProgressMovement(capturePoint))
        const natoPlayers = modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
        const paxPlayers = modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(capturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
        
        if(isMoving) {
            if(currentDirection == Team.Nato) {
                if(paxTeamWasCapturing) {
                    ForEach(natoPlayers, (player) => mod.StopSound(tickEnemySfx, player))
                }
                else if(wasContested) {
                    wasContested = false
                    ForEach(natoPlayers, (player) => mod.StopSound(contestSfx, player))
                    ForEach(paxPlayers, (player) => mod.StopSound(contestSfx, player))
                }
            
                ForEach(natoPlayers, (player) => mod.PlaySound(tickAllySfx,  x % 2 == 0 ? capturePointProgress : (capturePointProgress  / 2), player))
                
                if(!natoTeamWasCapturing) {
                    ForEach(paxPlayers, (player) => mod.PlaySound(tickEnemySfx, 1, player))
                    natoTeamWasCapturing = true
                }
            }
            else if(currentDirection == Team.Pax) {
                if(natoTeamWasCapturing) {
                    natoTeamWasCapturing = false
                    ForEach(paxPlayers, (player) => mod.StopSound(tickEnemySfx, player))
                }
                else if(wasContested) {
                    wasContested = false
                    ForEach(natoPlayers, (player) => mod.StopSound(contestSfx, player))
                    ForEach(paxPlayers, (player) => mod.StopSound(contestSfx, player))
                }
                
                ForEach(paxPlayers, (player) => mod.PlaySound(tickAllySfx, x % 2 == 0 ? capturePointProgress : (capturePointProgress  / 2), player))
                if(!paxTeamWasCapturing) {
                    ForEach(natoPlayers, (player) => mod.PlaySound(tickEnemySfx, 1, player))
                    paxTeamWasCapturing = true
                }
            }
        }
        else {
            if(capturePointProgress != 0 && capturePointProgress != 1) {
                if(natoTeamWasCapturing) {
                    natoTeamWasCapturing = false
                    ForEach(paxPlayers, (player) => mod.StopSound(tickEnemySfx, player))
                }
                else if(paxTeamWasCapturing) {
                    paxTeamWasCapturing = false
                    ForEach(natoPlayers, (player) => mod.StopSound(tickEnemySfx, player))
                }
                
                paxTeamWasCapturing = false
                if(!wasContested) {
                    ForEach(natoPlayers, (player) => mod.PlaySound(contestSfx, 1, player))
                    ForEach(paxPlayers, (player) => mod.PlaySound(contestSfx, 1, player))
                    wasContested = true
                }
            }
        }
        x += 1
        await mod.Wait(0.4)
    } 
}
// ----NOTIFY FUNCTION---//
function NotifyOnFlagPlayersOfStateChange(capturePoint : mod.CapturePoint) {
    const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
    const owner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const captureAudio = mod.ValueInArray(mod.GetVariable(capturePointSound), 5)
    const neutralizeAudio = mod.ValueInArray(mod.GetVariable(capturePointSound), 6)
    const natoPlayers = mod.GetVariable(natoPlayersOnCapturePoint(capturePoint))
    const paxPlayers = mod.GetVariable(paxPlayersOnCapturePoint(capturePoint))
    const nbPaxPlayers = mod.CountOf(paxPlayers)
    const nbNatoPlayers = mod.CountOf(natoPlayers)
    for(let x = 0; x < nbNatoPlayers; x += 1) {
        const currPlayer = mod.ValueInArray(natoPlayers, x)
        if(mod.Not(mod.GetSoldierState(currPlayer, mod.SoldierStateBool.IsManDown))) {
            DisplayOnFlagLayer(currPlayer, flag)
            UpdatePlayerOnFlagLayer(currPlayer, nbPaxPlayers, nbNatoPlayers, flag)
            if(owner == Team.Nato) {
                mod.PlaySound(captureAudio, 1, currPlayer)
            }
            else if(owner == Team.Neutral) {
                mod.PlaySound(neutralizeAudio, 1, currPlayer)
            }
        }
        
    }
    for(let x = 0; x < nbPaxPlayers; x += 1) {
        const currPlayer = mod.ValueInArray(paxPlayers, x)
        if(mod.Not(mod.GetSoldierState(currPlayer, mod.SoldierStateBool.IsManDown))) {
            DisplayOnFlagLayer(currPlayer, flag)
            UpdatePlayerOnFlagLayer(currPlayer, nbPaxPlayers, nbNatoPlayers, flag)
            if(owner == Team.Pax) {
                mod.PlaySound(captureAudio, 1, currPlayer)
            }
            else if(owner == Team.Neutral) {
                mod.PlaySound(neutralizeAudio, 1, currPlayer)
            }
        }
        
    }
}
function NotifyPlayerUiOfFlagCaptureState(capturePoint : mod.CapturePoint) {
    const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const capturePointPlayersArrayNato = mod.GetVariable(natoPlayersOnCapturePoint(capturePoint))
    const capturePointPlayersArrayPax = mod.GetVariable(paxPlayersOnCapturePoint(capturePoint))
    const captureProgress = mod.GetVariable(oldCaptureStepCapturePoint(capturePoint))
    let layerPax = 0
    let layerNato = 0
    if(capturePointOwner == Team.Neutral) {
        layerNato = 1
        layerPax = 1
    }
    else if(capturePointOwner == Team.Nato) {
        layerNato = 0
        layerPax = 2
    }
    else {
        layerNato = 2
        layerPax = 0
    }
    ForEach(capturePointPlayersArrayNato, (player) => updateOnFlagLayerCaptureProgress(player, captureProgress, layerNato))
    ForEach(capturePointPlayersArrayPax, (player) => updateOnFlagLayerCaptureProgress(player, captureProgress, layerPax))
    

}
function NotifyFlagOfPopulationChange(capturePoint : mod.CapturePoint) {
    const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const nbNatoPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    const nbPaxPlayersNotDown = mod.CountOf(modlib.FilteredArray(mod.GetVariable(paxPlayersOnCapturePoint(capturePoint)), (player) => mod.Not(mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown))))
    if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
        if(capturePointOwner == Team.Nato &&  nbPaxPlayersNotDown == 0) {
            SetFlagBlink(flag, false)
        }
        else if(capturePointOwner == Team.Pax &&  nbNatoPlayersNotDown == 0) {
            SetFlagBlink(flag, false)
        }
        else if(nbNatoPlayersNotDown == 0 && nbPaxPlayersNotDown == 0){
            SetFlagBlink(flag, false)
        }
    }
    else {
        if(capturePointOwner == Team.Nato &&  nbPaxPlayersNotDown != 0) {
            SetFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Pax &&  nbNatoPlayersNotDown != 0) {
            SetFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Neutral && (nbNatoPlayersNotDown != 0 || nbPaxPlayersNotDown != 0)){
            SetFlagBlink(flag, true)
        }
    }
    if(nbNatoPlayersNotDown > nbPaxPlayersNotDown) {
        mod.SetVariable(capturePointProgressDirection(capturePoint), Team.Nato)
    }
    else if(nbPaxPlayersNotDown > nbNatoPlayersNotDown) {
        mod.SetVariable(capturePointProgressDirection(capturePoint), Team.Pax)
    }
    else {
        mod.SetVariable(capturePointProgressDirection(capturePoint), Team.Neutral)
    }
    NotifyPlayersOfPopulationChangeOnFlag(capturePoint)
}
function NotifyPlayersOfPopulationChangeOnFlag(capturePoint: mod.CapturePoint) {
    const flag = mod.GetVariable(flagOfCapturePoint(capturePoint))
    const natoPlayers = mod.GetVariable(natoPlayersOnCapturePoint(capturePoint))
    const paxPlayers = mod.GetVariable(paxPlayersOnCapturePoint(capturePoint))
    const nbNatoDownPlayers = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
    const nbPaxDownPlayers = mod.CountOf(modlib.FilteredArray(mod.GetVariable(natoPlayersOnCapturePoint(capturePoint)), (player) => mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)))
    const nbNatoPlayers = mod.CountOf(natoPlayers)
    const nbPaxPlayers = mod.CountOf(paxPlayers)
    ForEach(natoPlayers, (player) => UpdatePlayerOnFlagLayer(player, nbPaxPlayers - nbPaxDownPlayers, nbNatoPlayers - nbNatoDownPlayers, flag))
    ForEach(paxPlayers, (player) => UpdatePlayerOnFlagLayer(player, nbPaxPlayers - nbPaxDownPlayers, nbNatoPlayers - nbNatoDownPlayers, flag))
}

//-----SET FUNCTION----//
//Make asumption that you do not change to the same team
function SetFlagOwner(flag: number, team : number) {
    const oldFlagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    const natoFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Nato))
    const paxFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Pax))
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
        mod.SetVariable(teamFlags(Team.Nato), mod.GetVariable(teamFlags(Team.Nato)) - 1)
    }
    else {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, enemySection + flagOffset + x), false)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, allySection + flagOffset + x), false)
        }
        mod.SetVariable(teamFlags(Team.Pax), mod.GetVariable(teamFlags(Team.Pax)) - 1)
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
        mod.SetVariable(teamFlags(Team.Nato), mod.GetVariable(teamFlags(Team.Nato)) + 1)
    }
    else {
        for(let x = 0; x < 3; x += 1) {
            mod.SetUIWidgetVisible(mod.ValueInArray(natoFlagsWidgets, enemySection + flagOffset + x), true)
            mod.SetUIWidgetVisible(mod.ValueInArray(paxFlagsWidgets, allySection + flagOffset + x), true)
        }
        mod.SetVariable(teamFlags(Team.Pax), mod.GetVariable(teamFlags(Team.Pax)) + 1)
    }
    const nbFlag = mod.GetVariable(nb_flag)
    const majority = mod.Floor(nbFlag / 2)
    mod.SetVariableAtIndex(flagsOwner, flag, team)
    const nbPaxFlags = mod.GetVariable(teamFlags(Team.Pax))
    const nbNatoFlags = mod.GetVariable(teamFlags(Team.Nato))
    if(nbNatoFlags > majority) {
        mod.SetVariable(bleedTimerTeam, Team.Nato)
    }
    else if(nbPaxFlags > majority) {
        mod.SetVariable(bleedTimerTeam, Team.Pax)
    }
    else {
        mod.SetVariable(bleedTimerTeam, Team.Neutral)
    }
    if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
        SetFlagBlink(flag, false)
        SetFlagBlink(flag, true)
    }
}
function SetFlagBlink(flag : number, bool: boolean) {
    if(bool) {
        mod.SetVariableAtIndex(isFlagBlinking, flag, true)
    }
    else {
            const ownerArray = mod.GetVariable(flagsOwner)
            const natoFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Nato))
            const paxFlagsWidgets = mod.GetVariable(teamFlagsUi(Team.Pax))
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
function SetupFlagAudio() {
    //6 second sound
    // SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnExit_OneShot2D
    const onNeutralize = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Notification_ObjectiveSecured_FillIn_Neutral_OneShot2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    const onCaptureByAlly = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Notification_ObjectiveSecured_FillIn_Positive_OneShot2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    const onExist = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnExit_OneShot2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    const onEnter = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnEnter_OneShot2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    const onContestedLoop = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnContested_SimpleLoop2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    //tick sound
    const tickAlly = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickIcon_IsFriendly_OneShot2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    const tickEnemyLoop = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTick_IsEnemy_SimpleLoop2D, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(1,1,1))
    let soundArray = mod.EmptyArray()
    soundArray = mod.AppendToArray(soundArray, tickAlly)
    soundArray = mod.AppendToArray(soundArray, tickEnemyLoop)
    soundArray = mod.AppendToArray(soundArray, onContestedLoop)
    soundArray = mod.AppendToArray(soundArray, onEnter)
    soundArray = mod.AppendToArray(soundArray, onExist)
    soundArray = mod.AppendToArray(soundArray, onCaptureByAlly)
    soundArray = mod.AppendToArray(soundArray, onNeutralize)
    mod.SetVariable(capturePointSound, soundArray)
}
//------UPDATE FUNCTION------//   
function updateOnFlagLayerCaptureProgress(player : mod.Player, captureProgress : number, layer : number) {
    const widgetIndex = 2 + layer * 4
    const widget = mod.ValueInArray(mod.GetVariable(onFlagPlayerWidgets(player)), widgetIndex)
    if(layer == 0) {
        mod.SetUITextSize(widget, 67 * captureProgress)
    }
    else {
        mod.SetUIWidgetSize(widget, mod.Multiply(mod.CreateVector(54,54,0), captureProgress))
    }
}

function UpdatePlayerOnFlagLayer(player : mod.Player, nbPaxPlayers: number, nbNatoPlayer: number, flag: number) {
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
    mod.SetUIWidgetSize(mod.ValueInArray(playerOnFlagWidget, 14), mod.CreateVector(lineSizePerPlayer * nbAllyPlayers,6,0))
    mod.SetUIWidgetSize(mod.ValueInArray(playerOnFlagWidget, 15), mod.CreateVector(lineSizePerPlayer * nbEnemyPlayers,6,0))
    mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 16), mod.Message(nbAllyPlayers))
    mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 17), mod.Message(nbEnemyPlayers))
    mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 8), mod.Message(flagLetter))
    mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 12), mod.Message(flagLetter))
    mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 4), mod.Message(flagLetter))
    if(flagOwner == Team.Neutral) {
        mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), true)
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.capturing))
    }
    else if(playerTeamId != flagOwner) {
        mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), true)
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.neutralazing))
    }
    else {
        if(nbEnemyPlayers == 0) {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), false)
        }
        else {
            mod.SetUIWidgetVisible(mod.ValueInArray(playerOnFlagWidget, 13), true)
        }
        mod.SetUITextLabel(mod.ValueInArray(playerOnFlagWidget, 18), mod.Message(mod.stringkeys.defending))
    }
}
function AddToScore(number : number, team : number) {
    const widgetsArrayNato = mod.GetVariable(teamScoreUi(Team.Nato))
    const widgetsArrayPax = mod.GetVariable(teamScoreUi(Team.Pax))
    if(team == Team.Nato) {
        const widget0 = mod.ValueInArray(widgetsArrayNato, 2)
        const widget1 = mod.ValueInArray(widgetsArrayPax, 3)
        const widget2 = mod.ValueInArray(widgetsArrayNato, 0)
        const widget3 = mod.ValueInArray(widgetsArrayPax, 1)
        const newScore = mod.GetVariable(teamScore(Team.Nato)) + number
        if(newScore <= 0) {
            GameWin(Team.Pax)
        }
        else if(newScore <= (startScoreNato / 20)) {
            mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop)
        }
        mod.SetVariable(teamScore(Team.Nato), newScore)
        const sizeLine = mod.CreateVector(180 * (newScore / startScoreNato),12,0)
        mod.SetUITextLabel(widget0, mod.Message(mod.GetVariable(teamScore(Team.Nato))))
        mod.SetUITextLabel(widget1, mod.Message(mod.GetVariable(teamScore(Team.Nato))))
        mod.SetUIWidgetSize(widget2, sizeLine)
        mod.SetUIWidgetSize(widget3, sizeLine)
    }
    else if (team == Team.Pax) {
        const widget0 = mod.ValueInArray(widgetsArrayNato, 3)
        const widget1 = mod.ValueInArray(widgetsArrayPax, 2)
        const widget2 = mod.ValueInArray(widgetsArrayNato, 1)
        const widget3 = mod.ValueInArray(widgetsArrayPax, 0)
        const newScore = mod.GetVariable(teamScore(Team.Pax)) + number
        if(newScore <= 0) {
           GameWin(Team.Nato)
        }
        else if(newScore <= (startScorePax / 20)) {
            mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop)
        }
        mod.SetVariable(teamScore(Team.Pax), newScore)
        const sizeLine = mod.CreateVector(180 * (newScore / startScorePax),12,0)
        mod.SetUITextLabel(widget0, mod.Message(mod.GetVariable(teamScore(Team.Pax))))
        mod.SetUITextLabel(widget1, mod.Message(mod.GetVariable(teamScore(Team.Pax))))
        mod.SetUIWidgetSize(widget2, sizeLine)
        mod.SetUIWidgetSize(widget3, sizeLine)
    }
    const natoScore = mod.GetVariable(teamScore(Team.Nato))
    const paxScore = mod.GetVariable(teamScore(Team.Pax))
    if(natoScore > paxScore) {
        const widget0 = mod.ValueInArray(widgetsArrayNato, 4)
        const widget1 = mod.ValueInArray(widgetsArrayPax, 5)
        const widget2 = mod.ValueInArray(widgetsArrayNato, 5)
        const widget3 = mod.ValueInArray(widgetsArrayPax, 4)
        mod.SetUIWidgetVisible(widget0, true)
        mod.SetUIWidgetVisible(widget1, true)
        mod.SetUIWidgetVisible(widget2, false)
        mod.SetUIWidgetVisible(widget3, false)
    }
    else if(paxScore > natoScore) {
        const widget0 = mod.ValueInArray(widgetsArrayNato, 5)
        const widget1 = mod.ValueInArray(widgetsArrayPax, 4)
        const widget2 = mod.ValueInArray(widgetsArrayNato, 4)
        const widget3 = mod.ValueInArray(widgetsArrayPax, 5)
        mod.SetUIWidgetVisible(widget0, true)
        mod.SetUIWidgetVisible(widget1, true)
        mod.SetUIWidgetVisible(widget2, false)
        mod.SetUIWidgetVisible(widget3, false)
    }
    else {
        const widget0 = mod.ValueInArray(widgetsArrayNato, 5)
        const widget1 = mod.ValueInArray(widgetsArrayPax, 4)
        const widget2 = mod.ValueInArray(widgetsArrayNato, 4)
        const widget3 = mod.ValueInArray(widgetsArrayPax, 5)
        mod.SetUIWidgetVisible(widget0, false)
        mod.SetUIWidgetVisible(widget1, false)
        mod.SetUIWidgetVisible(widget2, false)
        mod.SetUIWidgetVisible(widget3, false)
    }
}
//-------DISPLAY FUNCTION----//
function DisplayOnFlagLayer(player : mod.Player, flag: number) {
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
    for(let x = 0; x < 3; x += 1) {
        updateOnFlagLayerCaptureProgress(player, 1, x)
    }
}

    //--------UI FONCTION---------------//
function MakeFlagUiLayer(nb_flag : number) {
    const neutralFlags = MakeNeutralFlagUiLayer(nb_flag)
    const allyFlags = MakeAllyFlagUiLayer(nb_flag)
    const enemyFlags = MakeEnemyFlagUiLayer(nb_flag)
    const natoFlags = mod.AppendToArray(neutralFlags[0], mod.AppendToArray(allyFlags[0], enemyFlags[0]))
    const paxFlags = mod.AppendToArray(neutralFlags[1], mod.AppendToArray(allyFlags[1], enemyFlags[1]))
    mod.SetVariable(teamFlagsUi(Team.Nato), natoFlags)
    mod.SetVariable(teamFlagsUi(Team.Pax), paxFlags)
}
function MakeAllyFlagUiLayer(nb_flag : number) {
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
function MakeNeutralFlagUiLayer(nb_flag : number) {
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
function MakeEnemyFlagUiLayer(nb_flag : number) : [mod.Array, mod.Array]{
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
function MakeUiTeamAnchor() {
    mod.AddUIContainer(mod.stringkeys.natoFlags, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetTeam(Team.Nato))
    const highestUiLayerNato = mod.FindUIWidgetWithName(mod.stringkeys.natoFlags)
    mod.AddUIContainer(mod.stringkeys.paxFlags, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetTeam(Team.Pax))
    const highestUiLayerPax = mod.FindUIWidgetWithName(mod.stringkeys.paxFlags)
    mod.SetVariableAtIndex(uiAnchors, Team.Nato, highestUiLayerNato)
    mod.SetVariableAtIndex(uiAnchors, Team.Pax, highestUiLayerPax)
}
function MakeScoreUi() {
    for(let x = 0; x < 2; x += 1) {
        let teamId = Team.Nato
        let teamOwner = mod.GetTeam(teamId)
        if(x != 0) {
            teamId = Team.Pax
            teamOwner = mod.GetTeam(teamId)
        }
        const highestUiLayer = mod.ValueInArray(mod.GetVariable(uiAnchors), teamId)


        mod.AddUIContainer(mod.stringkeys.score_backround_line_ally, mod.CreateVector(-183,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkBlueColor, 0.8, mod.UIBgFill.Blur, teamOwner)
        const baseLineAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_backround_line_ally, highestUiLayer)
        mod.AddUIContainer(mod.stringkeys.score_backround_line_enemy, mod.CreateVector(3,65, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkRedColor, 0.8, mod.UIBgFill.Blur, teamOwner)
        const baseLineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_backround_line_enemy, highestUiLayer)
        mod.AddUIContainer(mod.stringkeys.score_line_ally, mod.CreateVector(0,0, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopLeft, baseLineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        const scoreLineAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_line_ally, baseLineAlly)
        mod.AddUIContainer(mod.stringkeys.score_line_enemy, mod.CreateVector(0,0, 0), mod.CreateVector(180,12,0), mod.UIAnchor.TopRight, baseLineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        const scoreLineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_line_enemy, baseLineEnemy)
        mod.AddUIContainer(mod.stringkeys.score_base_score_num_ally, mod.CreateVector(-276,54, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkBlueColor, 0.8, mod.UIBgFill.Blur, teamOwner)
        const scoreBaseAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_base_score_num_ally, highestUiLayer)
        mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, scoreBaseAlly, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(teamId == Team.Nato ? mod.GetVariable(teamScore(Team.Nato)) : mod.GetVariable(teamScore(Team.Pax))), 35, blueColor, 1, mod.UIAnchor.Center, teamOwner)
        const scoreTextAlly = mod.FindUIWidgetWithName(mod.stringkeys.letter, scoreBaseAlly)

        mod.AddUIContainer(mod.stringkeys.score_base_score_num_enemy, mod.CreateVector(191,54, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, highestUiLayer, true, 0, darkRedColor, 0.8, mod.UIBgFill.Blur, teamOwner)
        const scoreBaseEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_base_score_num_enemy, highestUiLayer)
        mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, scoreBaseEnemy, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(teamId == Team.Pax ? mod.GetVariable(teamScore(Team.Nato)) : mod.GetVariable(teamScore(Team.Pax))), 35, redColor, 1, mod.UIAnchor.Center, teamOwner)
        const scoreTextEnemy = mod.FindUIWidgetWithName(mod.stringkeys.letter, scoreBaseEnemy)

        mod.AddUIContainer(mod.stringkeys.score_outline_ally, mod.CreateVector(0,0, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, scoreBaseAlly, false, 0, blueColor, 0, mod.UIBgFill.None, teamOwner)
        const scoreOutlineAlly = mod.FindUIWidgetWithName(mod.stringkeys.score_outline_ally, scoreBaseAlly)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomLeft, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomRight, scoreOutlineAlly, true, 0, blueColor, 1, mod.UIBgFill.Solid, teamOwner)

        mod.AddUIContainer(mod.stringkeys.score_outline_enemy, mod.CreateVector(0,0, 0), mod.CreateVector(84,33,0), mod.UIAnchor.TopLeft, scoreBaseEnemy, false, 0, redColor, 0, mod.UIBgFill.None, teamOwner)
        const scoreOutlineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.score_outline_enemy, scoreBaseEnemy)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomLeft, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(2,33,0), mod.UIAnchor.TopRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.TopRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        mod.AddUIContainer(mod.stringkeys.score_outline_piece, mod.CreateVector(0,0, 0), mod.CreateVector(8,2,0), mod.UIAnchor.BottomRight, scoreOutlineEnemy, true, 0, redColor, 1, mod.UIBgFill.Solid, teamOwner)
        
        const widgetsArray = mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.AppendToArray(mod.EmptyArray(), scoreLineAlly), scoreLineEnemy), scoreTextAlly), scoreTextEnemy), scoreOutlineAlly), scoreOutlineEnemy)
        
        if(teamId == Team.Nato) {
            mod.SetVariable(teamScoreUi(Team.Nato), widgetsArray)
        }
        else {
            mod.SetVariable(teamScoreUi(Team.Pax), widgetsArray)
        }
    }
}
function MakeUiAnchorPlayer(player: mod.Player) {
    const allKeys = Object.keys(mod.stringkeys)
    const playerId = mod.GetObjId(player)
    const keyId = playerId + 26
    mod.AddUIContainer(allKeys[keyId], mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.None, mod.UIDepth.AboveGameUI, player)
    const highestUiLayer = mod.FindUIWidgetWithName(allKeys[keyId])
    mod.SetVariable(playerUiAnchor(player), highestUiLayer)
}
function MakeOnFlagUiLayer(player : mod.Player) {
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
    
    mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(54,54,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, whiteColor, colorAlpha, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const neutralOutline = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, neutralUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(49,49,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const neutralInside = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, neutralUiLayer)
    
    mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, neutralUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.A), 28, whiteColor, colorAlpha, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI, player)
    const letterNeutral = mod.FindUIWidgetWithName(mod.stringkeys.letter, neutralUiLayer)

    // --- Enemy Flag ---
    const enemyUiLayerName = mod.stringkeys.enemy
    mod.AddUIContainer(enemyUiLayerName, mod.CreateVector(0,200,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, false, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, mod.UIDepth.AboveGameUI, player)
    const enemyUiLayer = mod.FindUIWidgetWithName(enemyUiLayerName, highestUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(54,54,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, redColor, colorAlpha, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const enemyOutline = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, enemyUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(49,49,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, blackColor, insideAlpha, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const enemyInside = mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, enemyUiLayer)
    
    mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, enemyUiLayer, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.A), 28, redColor, colorAlpha, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI, player)
    const letterEnemy = mod.FindUIWidgetWithName(mod.stringkeys.letter, enemyUiLayer)

    // --- Contestation Logic ---
    mod.AddUIContainer(mod.stringkeys.contest_line, mod.CreateVector(0,238, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0, blueColor, 1, mod.UIBgFill.None, mod.UIDepth.AboveGameUI, player)
    const contestLine = mod.FindUIWidgetWithName(mod.stringkeys.contest_line, highestUiLayer)
    
    mod.AddUIContainer(mod.stringkeys.contest_line_ally, mod.CreateVector(0,0, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopLeft, contestLine, true, 0, blueColor, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const contestLineAlly = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_ally, contestLine)
    
    mod.AddUIContainer(mod.stringkeys.contest_line_enemy, mod.CreateVector(0,0, 0), mod.CreateVector(89,6,0), mod.UIAnchor.TopRight, contestLine, true, 0, redColor, 1, mod.UIBgFill.Solid, mod.UIDepth.AboveGameUI, player)
    const contestLineEnemy = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_enemy, contestLine)
    
    mod.AddUIText(mod.stringkeys.contest_line_num_ally, mod.CreateVector(-13,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.CenterLeft, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(2), 18, blueColor, 0.6, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI, player)
    const contestNumAlly = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_num_ally, contestLine)
    
    mod.AddUIText(mod.stringkeys.contest_line_num_enemy, mod.CreateVector(-13,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.CenterRight, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(2), 18, redColor, 0.6, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI, player)
    const contestNumEnemy = mod.FindUIWidgetWithName(mod.stringkeys.contest_line_num_enemy, contestLine)
    
    mod.AddUIText(mod.stringkeys.capture_point_msg, mod.CreateVector(0,-13, 0), mod.CreateVector(0,0,0), mod.UIAnchor.BottomCenter, contestLine, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.defending), 18, whiteColor, 0.6, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI, player)
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
//-------OTHER FUNCTION------//
function RemoveInvalidPlayerFromFlag() {
    for(let x = 0; x < mod.GetVariable(nb_flag); x += 1) {
        const currCapturePoint = mod.ValueInArray(mod.AllCapturePoints(), x)
        let paxPlayers = mod.GetVariable(paxPlayersOnCapturePoint(currCapturePoint))
        let natoPlayers = mod.GetVariable(natoPlayersOnCapturePoint(currCapturePoint))
        if(modlib.IsTrueForAny(paxPlayers, (player) => mod.Not(mod.IsPlayerValid(player)))) {
            paxPlayers = modlib.FilteredArray(paxPlayers, (player) => mod.IsPlayerValid(player))
            mod.SetVariable(paxPlayersOnCapturePoint(currCapturePoint), paxPlayers)
            NotifyPlayersOfPopulationChangeOnFlag(currCapturePoint)
        }
        else if(modlib.IsTrueForAny(natoPlayers, (player) => mod.Not(mod.IsPlayerValid(player)))) {
            natoPlayers = modlib.FilteredArray(natoPlayers, (player) => mod.IsPlayerValid(player))
            mod.SetVariable(natoPlayersOnCapturePoint(currCapturePoint), natoPlayers)
            NotifyPlayersOfPopulationChangeOnFlag(currCapturePoint)
        }
    }
}
function RemovePlayerFromCapturePointIfNecessary(player : mod.Player) : number{
    const playerFlag = mod.GetVariable(playerIsOnFlag(player))
    if(playerFlag != -1) {
        const soundArray = mod.GetVariable(capturePointSound)
        const tickEnemySfx = mod.ValueInArray(soundArray, 1)
        const contestSfx = mod.ValueInArray(soundArray, 2)
        mod.StopSound(tickEnemySfx, player)
        mod.StopSound(contestSfx, player)
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
            capturePointPlayersArray = modlib.FilteredArray(capturePointPlayersArray, (other) => mod.GetObjId(other) != playerId)
            if(playerTeamId == Team.Nato) {
                mod.SetVariable(natoPlayersOnCapturePoint(currCapturePoint), capturePointPlayersArray)
            }
            else {
                mod.SetVariable(paxPlayersOnCapturePoint(currCapturePoint), capturePointPlayersArray)
            }
            const flag = mod.GetVariable(flagOfCapturePoint(currCapturePoint))
            NotifyFlagOfPopulationChange(currCapturePoint)
            removeFromViewOnFlagLayer(player)
            return flag
        
        }
    return -1
}


function GameWin(team : Team) {
    mod.EndGameMode(mod.GetTeam(team))
    mod.PlayMusic(mod.MusicEvents.Core_Stop)
    mod.PlayMusic(mod.MusicEvents.Core_EndOfRound_Loop)
}
//------------Utility Function---------------//
export function ForEach(array: mod.Array, fun: (currentElement: any) => any): void {
    const arr = modlib.ConvertArray(array);
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentElement = arr[i];
        fun(currentElement)
    }
}

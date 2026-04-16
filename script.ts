//change to "modlib" when charging on serv
import * as modlib from "./modlib"
//comment out when charging to serv
import * as mod from "./types/mod/index";
//Color Vector
const blueColor = mod.CreateVector(0.439, 0.922, 1)
const grayColor = mod.CreateVector(0.212, 0.224, 0.235)
const redColor = mod.CreateVector(1, 0.514, 0.38)
const blackColor = mod.CreateVector(0.031, 0.031, 0.031)
const whiteColor = mod.CreateVector(1,1,1)
//Global Variable
const isGameModeReady = mod.GlobalVariable(1)
const flagBlinking = mod.GlobalVariable(2)
const newFlagBlinking = mod.GlobalVariable(9)
const isFlagBlinking = mod.GlobalVariable(8)
const isBlinkRunning = mod.GlobalVariable(3)
const natoFlagsUi = mod.GlobalVariable(4)
const paxFlagsUi = mod.GlobalVariable(5)
const flagsOwner = mod.GlobalVariable(6)
const uiAnchors = mod.GlobalVariable(7)
const nb_flag = mod.GlobalVariable(10)
//PerObjectVariable
function nbNatoPlayerOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 1)}
function nbPaxPlayerOnCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 2)}
function flagOfCapturePoint(capturePoint : mod.CapturePoint) : mod.Variable {return mod.ObjectVariable(capturePoint, 3)}
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
    mod.SetVariable(isFlagBlinking, isFlagBlinkingArray)
    mod.SetVariable(flagsOwner, flagsOwnerArray)
    mod.SetVariable(flagBlinking, mod.EmptyArray())
    mod.SetVariable(newFlagBlinking, mod.EmptyArray())
    mod.SetVariable(isBlinkRunning, false)
    makeUiTeamAnchor()
    makeFlagUiLayer(numberOfFlag)
    mod.EnableGameModeObjective(mod.GetSector(300), true)
    for(let x = 0; x < mod.CountOf(mod.AllCapturePoints()); x += 1) {
        const capturePoint = mod.ValueInArray(mod.AllCapturePoints(), x)  
        mod.SetVariable(flagOfCapturePoint(capturePoint), x)
        mod.SetVariable(nbNatoPlayerOnCapturePoint(capturePoint), 0)
        mod.SetVariable(nbPaxPlayerOnCapturePoint(capturePoint), 0)
        mod.EnableGameModeObjective(capturePoint, true)
        mod.EnableCapturePointDeploying(capturePoint, true)
        mod.SetCapturePointCapturingTime(capturePoint, 10)
        mod.SetCapturePointNeutralizationTime(capturePoint, 10)
        mod.SetMaxCaptureMultiplier(capturePoint, 2)
        setFlagOwner(x, mod.GetObjId(mod.GetCurrentOwnerTeam(capturePoint)))
    }
    mod.SetVariable(isGameModeReady, 1)

}

export function OnPlayerDeployed(eventPlayer: mod.Player): void { 
    if(mod.IsSoldierClass(eventPlayer, mod.SoldierClass.Recon)) {
        mod.SetTeam(eventPlayer, mod.GetTeam(Team.Pax))
    }
}
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    setFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
}
export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    setFlagBlink(flag, false);
    setFlagOwner(flag, mod.GetObjId(mod.GetCurrentOwnerTeam(eventCapturePoint)))
}
export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    if(mod.GetObjId(mod.GetTeam(eventPlayer)) == Team.Nato) {
        mod.SetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint), mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) + 1)
    }
    else {
        mod.SetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint), mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) + 1)
    }
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    if(mod.Not(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag))) {
        if(capturePointOwner == Team.Nato &&  mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) != 0) {
            setFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Pax &&  mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) != 0) {
            setFlagBlink(flag, true)
        }
        else if(capturePointOwner == Team.Neutral && (mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) != 0 || mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) != 0)){
            setFlagBlink(flag, true)
        }
    }
}
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    if(mod.GetObjId(mod.GetTeam(eventPlayer)) == Team.Nato) {
        mod.SetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint), mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) - 1)
    }
    else {
        mod.SetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint), mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) - 1)
    }
    const flag = mod.GetVariable(flagOfCapturePoint(eventCapturePoint))
    const capturePointOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
    if(mod.ValueInArray(mod.GetVariable(isFlagBlinking), flag)) {
        if(capturePointOwner == Team.Nato &&  mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) == 0) {
            setFlagBlink(flag, false)
        }
        else if(capturePointOwner == Team.Pax &&  mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) == 0) {
            setFlagBlink(flag, false)
        }
        else if(mod.GetVariable(nbNatoPlayerOnCapturePoint(eventCapturePoint)) == 0 && mod.GetVariable(nbPaxPlayerOnCapturePoint(eventCapturePoint)) == 0){
            setFlagBlink(flag, false)
        }
    }
}
//main loop
export async function OngoingGlobal(): Promise<void> {
    
    await mod.Wait(0.05)
    if(mod.GetVariable(isGameModeReady) == 1) {
        if(mod.Not(mod.GetVariable(isBlinkRunning))) {
            blink()
        }
    }

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
    const allKeys = Object.keys(mod.stringkeys)
    if(bool) {
        const flagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
        const flagOffset = flag * 3
        const numberOfFlag = mod.GetVariable(nb_flag)
        const neutralSection = 0
        const allySection = numberOfFlag * 3
        const enemySection = (numberOfFlag * 3) * 2
        let natoFlagStateOffest = neutralSection
        let paxFlagStateOffest = neutralSection
        if(flagOwner == Team.Nato) {
            natoFlagStateOffest = allySection
            paxFlagStateOffest = enemySection
        }
        else if(flagOwner == Team.Pax) {
            natoFlagStateOffest = enemySection
            paxFlagStateOffest = allySection
        }
        const paxFlagsWidgets = mod.GetVariable(paxFlagsUi)
        const natoFlagsWidgets = mod.GetVariable(natoFlagsUi)
        let uiWidgetBlinking = mod.EmptyArray()
        const pax_outline = mod.ValueInArray(paxFlagsWidgets, paxFlagStateOffest + flagOffset)
        const pax_pt = mod.ValueInArray(paxFlagsWidgets, paxFlagStateOffest + flagOffset + 1)
        const pax_letter = mod.ValueInArray(paxFlagsWidgets, paxFlagStateOffest + flagOffset + 2)

        const nato_outline = mod.ValueInArray(natoFlagsWidgets, natoFlagStateOffest + flagOffset)
        const nato_pt = mod.ValueInArray(natoFlagsWidgets, natoFlagStateOffest + flagOffset + 1)
        const nato_letter = mod.ValueInArray(natoFlagsWidgets, natoFlagStateOffest + flagOffset + 2)


        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, nato_outline)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, nato_pt)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, nato_letter)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, pax_outline)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, pax_pt)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, pax_letter)
        mod.SetVariable(newFlagBlinking, mod.AppendToArray(mod.GetVariable(newFlagBlinking), uiWidgetBlinking))
        mod.SetVariableAtIndex(isFlagBlinking, flag, true)
    }
    else {
        let flagBlinkingArray = mod.GetVariable(flagBlinking)
       flagBlinkingArray = modlib.FilteredArray(flagBlinkingArray, (currentElement) => {
            const parent = mod.GetUIWidgetParent(currentElement);
            const isNotChildOfTarget = mod.Not(mod.Equals(mod.GetUIWidgetName(parent), allKeys[flag]));
            return isNotChildOfTarget;
        });
        mod.SetVariable(flagBlinking, flagBlinkingArray)
        mod.SetVariableAtIndex(isFlagBlinking, flag, false)
    }
}
//HARD LIMIT 9 FLAG BLINKING AT THE SAME TIME START LAG (Only on the UI)
async function blink() {
    mod.SetVariable(isBlinkRunning, true)
    const flagBlinkingArray = mod.GetVariable(flagBlinking)
    const sizeFlagBlinkingArray = mod.CountOf(flagBlinkingArray)
    const newFlagBlinkingArray = mod.GetVariable(newFlagBlinking)
    const sizeNewFlagBlinkingArray = mod.CountOf(newFlagBlinkingArray)
    if(sizeFlagBlinkingArray != 0 || sizeNewFlagBlinkingArray != 0) {
        let finalArray = mod.AppendToArray(flagBlinkingArray, newFlagBlinkingArray)
        if(sizeNewFlagBlinkingArray != 0) {
            mod.SetVariable(flagBlinking, finalArray)
            mod.SetVariable(newFlagBlinking, mod.EmptyArray())
        }
        let finalSize = sizeFlagBlinkingArray + sizeNewFlagBlinkingArray
        let uiWidgetIsContainerArray = mod.EmptyArray()
        let uiWidgetBlinkingAlpha = mod.EmptyArray()
        for(let x = 0; x < finalSize; x +=1) {
            const currentWidget =  mod.ValueInArray(finalArray, x)
            const widgetName = mod.GetUIWidgetName(currentWidget)
            if(mod.Or(mod.Equals(widgetName, mod.stringkeys.rectangle_outline), mod.Equals(widgetName, mod.stringkeys.rectangle_inside))) {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUIWidgetBgAlpha(currentWidget))
                uiWidgetIsContainerArray = mod.AppendToArray(uiWidgetIsContainerArray, true)
            }
            else {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUITextAlpha(currentWidget))
                uiWidgetIsContainerArray = mod.AppendToArray(uiWidgetIsContainerArray, false)
            }
             
        }
        // Fade Out
        if(mod.CountOf(finalArray) != 0) {
            for(let x = 1; x >= 0.3; x -= 0.1) {
                const tuplesArray = updateArraysForBlink(finalArray, uiWidgetBlinkingAlpha, uiWidgetIsContainerArray)
                finalArray = tuplesArray[0]
                uiWidgetBlinkingAlpha = tuplesArray[1]
                uiWidgetIsContainerArray = tuplesArray[2]
                for(let y = 0; y < finalSize; y += 1) {
                    if(mod.ValueInArray(uiWidgetIsContainerArray, y)) {
                        mod.SetUIWidgetBgAlpha(mod.ValueInArray(finalArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                    else {
                        mod.SetUITextAlpha(mod.ValueInArray(finalArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                }
                await mod.Wait(0.05);
            }
            // Fade In
            for(let x = 0.3; x <= 1; x += 0.1) {
                const tuplesArray = updateArraysForBlink(finalArray, uiWidgetBlinkingAlpha, uiWidgetIsContainerArray)
                finalArray = tuplesArray[0]
                uiWidgetBlinkingAlpha = tuplesArray[1]
                uiWidgetIsContainerArray = tuplesArray[2]
                for(let y = 0; y < finalSize; y += 1) {
                    if(mod.ValueInArray(uiWidgetIsContainerArray, y)) {
                        mod.SetUIWidgetBgAlpha(mod.ValueInArray(finalArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                    else {
                        mod.SetUITextAlpha(mod.ValueInArray(finalArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                }
                await mod.Wait(0.05);
            }
            
        }
    }
    
    mod.SetVariable(isBlinkRunning, false)
    }
    function updateArraysForBlink(widgets : mod.Array, aplhas : mod.Array, isContainers : mod.Array) : [mod.Array, mod.Array, mod.Array]{
        const newFlagBlinkingArray = mod.GetVariable(newFlagBlinking)
        const sizeNewFlagBlinkingArray = mod.CountOf(newFlagBlinkingArray)
        if(sizeNewFlagBlinkingArray != 0) {
            let uiWidgetArray = widgets
            let uiWidgetBlinkingAlpha = aplhas
            let uiWidgetIsContainerArray = isContainers
            for(let x = 0; x < sizeNewFlagBlinkingArray; x +=1) {
            const currentWidget =  mod.ValueInArray(newFlagBlinkingArray, x)
            const widgetName = mod.GetUIWidgetName(currentWidget)
            uiWidgetArray = mod.AppendToArray(uiWidgetArray, currentWidget)
            if(mod.Or(mod.Equals(widgetName, mod.stringkeys.rectangle_outline), mod.Equals(widgetName, mod.stringkeys.rectangle_inside))) {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUIWidgetBgAlpha(currentWidget))
                uiWidgetIsContainerArray = mod.AppendToArray(uiWidgetIsContainerArray, true)
            }
            else {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUITextAlpha(currentWidget))
                uiWidgetIsContainerArray = mod.AppendToArray(uiWidgetIsContainerArray, false)
            }
             
            }
            mod.SetVariable(flagBlinking, uiWidgetArray)
            mod.SetVariable(newFlagBlinking, mod.EmptyArray())
            return [uiWidgetArray, uiWidgetBlinkingAlpha, uiWidgetIsContainerArray]
        }
        return [widgets, aplhas, isContainers]

    }
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
                mod.AddUIText(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 40, blueColor, 0.8, mod.UIAnchor.Center, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, baseIU))
                mod.AddUIText(mod.stringkeys.circle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 36, blackColor, 0.9, mod.UIAnchor.Center,teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.circle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, blueColor, 0.8, mod.UIAnchor.Center, teamOwner)
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
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(33,33,0), mod.UIAnchor.Center, baseIU, true, 0, whiteColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(30,30,0), mod.UIAnchor.Center, baseIU, true, 0, blackColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, whiteColor, 0.8, mod.UIAnchor.Center, teamOwner)
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
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(33,33,0), mod.UIAnchor.Center, baseIU, false, 0, redColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(30,30,0), mod.UIAnchor.Center, baseIU, false, 0, blackColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_inside, baseIU))
                mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, redColor, 0.8, mod.UIAnchor.Center, teamOwner)
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


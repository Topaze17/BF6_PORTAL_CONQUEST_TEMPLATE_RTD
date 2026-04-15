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
const numberOfFlag = 26
//Global Variable
const isGameModeReady = mod.GlobalVariable(1)
const flagBlinking = mod.GlobalVariable(2)
const isBlinkRunning = mod.GlobalVariable(3)
const natoFlagsUi = mod.GlobalVariable(4)
const paxFlagsUi = mod.GlobalVariable(5)
const flagsOwner = mod.GlobalVariable(6)
//Enum
enum Team {
    Neutral,
    Nato,
    Pax
}
//Setup
export function OnGameModeStarted(): void {
    let flagsOwnerArray = mod.EmptyArray()
    for(let x = 0; x < numberOfFlag; x += 1) {
        flagsOwnerArray = mod.AppendToArray(flagsOwnerArray, Team.Neutral)
    }
    mod.SwitchTeams(mod.GetTeam(Team.Nato), mod.GetTeam(Team.Pax))
    mod.SetVariable(flagsOwner, flagsOwnerArray)
    mod.SetVariable(flagBlinking, mod.EmptyArray())
    mod.SetVariable(isBlinkRunning, false)
    makeFlagUiLayer()
    mod.SetVariable(isGameModeReady, 1)

}

export function OnPlayerDeployed(eventPlayer: mod.Player): void { 
    if(mod.IsSoldierClass(eventPlayer, mod.SoldierClass.Recon)) {
        mod.SetTeam(eventPlayer, mod.GetTeam(Team.Pax))
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
function setFlagBlink(flag : number, bool: boolean) {
    const allKeys = Object.keys(mod.stringkeys)
    if(bool) {
        const flagOwner = mod.ValueInArray(mod.GetVariable(flagsOwner), flag)
        const flagOffset = flag * 3
        const neutralSection = 0
        const allySection = 78
        const enemySection = 156
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
        mod.SetVariable(flagBlinking, mod.AppendToArray(mod.GetVariable(flagBlinking), uiWidgetBlinking))
    }
    else {
        let flagBlinkingArray = mod.GetVariable(flagBlinking)
       flagBlinkingArray = modlib.FilteredArray(flagBlinkingArray, (currentElement) => {
            const parent = mod.GetUIWidgetParent(currentElement);
            const isNotChildOfTarget = mod.Not(mod.Equals(mod.GetUIWidgetName(parent), allKeys[flag]));
            return isNotChildOfTarget;
        });
        mod.SetVariable(flagBlinking, flagBlinkingArray)
    }
}
//HARD LIMIT 9 FLAG BLINKING AT THE SAME TIME START LAG (Only on the UI)
async function blink() {
    mod.SetVariable(isBlinkRunning, true)
    const flagBlinkingArray = mod.GetVariable(flagBlinking)
    const sizeFlagBlinkingArray = mod.CountOf(flagBlinkingArray)
    if(sizeFlagBlinkingArray != 0) {
        let uiWidgetIsContainerArray = mod.EmptyArray()
        let uiWidgetBlinkingAlpha = mod.EmptyArray()
        for(let x = 0; x < sizeFlagBlinkingArray; x +=1) {
            const currentWidget =  mod.ValueInArray(flagBlinkingArray, x)
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
        if(mod.CountOf(flagBlinkingArray) != 0) {
            for(let x = 1; x >= 0.3; x -= 0.1) {
                for(let y = 0; y < sizeFlagBlinkingArray; y += 1) {
                    if(mod.ValueInArray(uiWidgetIsContainerArray, y)) {
                        mod.SetUIWidgetBgAlpha(mod.ValueInArray(flagBlinkingArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                    else {
                        mod.SetUITextAlpha(mod.ValueInArray(flagBlinkingArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                }
                await mod.Wait(0.05);
            }
            // Fade In
            for(let x = 0.3; x <= 1; x += 0.1) {
                for(let y = 0; y < sizeFlagBlinkingArray; y += 1) {
                    if(mod.ValueInArray(uiWidgetIsContainerArray, y)) {
                        mod.SetUIWidgetBgAlpha(mod.ValueInArray(flagBlinkingArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                    else {
                        mod.SetUITextAlpha(mod.ValueInArray(flagBlinkingArray, y), x * mod.ValueInArray(uiWidgetBlinkingAlpha, y))
                    }
                }
                await mod.Wait(0.05);
            }
            
        }
    }
    
    mod.SetVariable(isBlinkRunning, false)
    }
    function makeFlagUiLayer() {
        const neutralFlags = makeNeutralFlagUiLayer()
        const allyFlags = makeAllyFlagUiLayer()
        const enemyFlags = makeEnemyFlagUiLayer()
        const natoFlags = mod.AppendToArray(neutralFlags[0], mod.AppendToArray(allyFlags[0], enemyFlags[0]))
        const paxFlags = mod.AppendToArray(neutralFlags[1], mod.AppendToArray(allyFlags[1], enemyFlags[1]))
        mod.SetVariable(natoFlagsUi, natoFlags)
        mod.SetVariable(paxFlagsUi, paxFlags)
    }
    function makeAllyFlagUiLayer() {
        const allKeys = Object.keys(mod.stringkeys)
        const allyUiLayerName = mod.stringkeys.ally
        const natoUiLayerName = mod.stringkeys.natoFlags
        const paxUiLayerName = mod.stringkeys.paxFlags
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let highestUiLayerName = natoUiLayerName
            let teamOwner = mod.GetTeam(Team.Nato)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamOwner = mod.GetTeam(Team.Pax)
                highestUiLayerName = paxUiLayerName
            }
            mod.AddUIContainer(highestUiLayerName, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, teamOwner)
            const highestUiLayer = mod.FindUIWidgetWithName(highestUiLayerName)
            mod.AddUIContainer(allyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const allyUiLayer = mod.FindUIWidgetWithName(allyUiLayerName, highestUiLayer)
            for(let l = 0; l < 26; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, allyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
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
    function makeNeutralFlagUiLayer() {
        const allKeys = Object.keys(mod.stringkeys)
        const neutralUiLayerName = mod.stringkeys.neutral
        const natoUiLayerName = mod.stringkeys.natoFlags
        const paxUiLayerName = mod.stringkeys.paxFlags
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let highestUiLayerName = natoUiLayerName
            let teamOwner = mod.GetTeam(Team.Nato)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamOwner = mod.GetTeam(Team.Pax)
                highestUiLayerName = paxUiLayerName
            }
            mod.AddUIContainer(highestUiLayerName, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, teamOwner)
            const highestUiLayer = mod.FindUIWidgetWithName(highestUiLayerName)
            mod.AddUIContainer(neutralUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const neutralUiLayer = mod.FindUIWidgetWithName(neutralUiLayerName, highestUiLayer)
            for(let l = 0; l < 26; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, neutralUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
                const baseIU = mod.FindUIWidgetWithName(baseUIName, neutralUiLayer)
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(35,35,0), mod.UIAnchor.Center, baseIU, true, 0, whiteColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(31,31,0), mod.UIAnchor.Center, baseIU, true, 0, blackColor, 0.8, mod.UIBgFill.Solid, teamOwner)
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
    function makeEnemyFlagUiLayer() : [mod.Array, mod.Array]{
        const allKeys = Object.keys(mod.stringkeys)
        const enemyUiLayerName = mod.stringkeys.enemy
        const natoUiLayerName = mod.stringkeys.natoFlags
        const paxUiLayerName = mod.stringkeys.paxFlags
        let natoFlagsArray = mod.EmptyArray()
        let paxFlagsArray = mod.EmptyArray()
        for(let x = 0; x < 2; x += 1) {
            let highestUiLayerName = natoUiLayerName
            let teamOwner = mod.GetTeam(Team.Nato)
            let flagsArray = mod.EmptyArray()
            if(x != 0) {
                teamOwner = mod.GetTeam(Team.Pax)
                highestUiLayerName = paxUiLayerName
            }
            mod.AddUIContainer(highestUiLayerName, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, teamOwner)
            const highestUiLayer = mod.FindUIWidgetWithName(highestUiLayerName)
            mod.AddUIContainer(enemyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, highestUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
            const enemyUiLayer = mod.FindUIWidgetWithName(enemyUiLayerName, highestUiLayer)
            for(let l = 0; l < 26; l +=1) {
                const baseUIName = allKeys[l]
                mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, enemyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur, teamOwner)
                const baseIU = mod.FindUIWidgetWithName(baseUIName, enemyUiLayer)
                mod.AddUIContainer(mod.stringkeys.rectangle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(35,35,0), mod.UIAnchor.Center, baseIU, false, 0, redColor, 0.8, mod.UIBgFill.Solid, teamOwner)
                flagsArray = mod.AppendToArray(flagsArray, mod.FindUIWidgetWithName(mod.stringkeys.rectangle_outline, baseIU))
                mod.AddUIContainer(mod.stringkeys.rectangle_inside, mod.CreateVector(0,0, 0), mod.CreateVector(31,31,0), mod.UIAnchor.Center, baseIU, false, 0, blackColor, 0.8, mod.UIBgFill.Solid, teamOwner)
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


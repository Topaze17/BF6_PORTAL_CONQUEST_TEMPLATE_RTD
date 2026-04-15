import * as modlib from "./modlib"
//Color Vector
const blueColor = mod.CreateVector(0.439, 0.922, 1)
const grayColor = mod.CreateVector(0.212, 0.224, 0.235)
const redColor = mod.CreateVector(1, 0.514, 0.38)
const blackColor = mod.CreateVector(0.031, 0.031, 0.031)
const whiteColor = mod.CreateVector(1,1,1)
//Global Variable
const isGameModeReady = mod.GlobalVariable(1)
const flagBlinking = mod.GlobalVariable(2)
const isBlinkRunning = mod.GlobalVariable(3)
//Setup
export function OnGameModeStarted(): void {
    mod.SetVariable(flagBlinking, mod.EmptyArray())
    mod.SetVariable(isBlinkRunning, false)
    makeNeutralFlagUiLayer()
    makeAllyFlagUiLayer()
    makeEnemyFlagUiLayer()
    mod.SetVariable(isGameModeReady, 1)
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void { 
    setFlagBlink(3, true)
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
        let uiWidgetBlinking = mod.EmptyArray()
        const ally_base = mod.FindUIWidgetWithName(allKeys[flag], mod.FindUIWidgetWithName(mod.stringkeys.ally));
        const ally_letter = mod.FindUIWidgetWithName(mod.stringkeys.letter, ally_base);
        const ally_outline = mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, ally_base);
        const ally_pt = mod.FindUIWidgetWithName(mod.stringkeys.pt, ally_base);
        const neutral_base = mod.FindUIWidgetWithName(allKeys[flag], mod.FindUIWidgetWithName(mod.stringkeys.neutral));
        const neutral_letter = mod.FindUIWidgetWithName(mod.stringkeys.letter, neutral_base);
        const neutral_outline = mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, neutral_base);
        const neutral_pt = mod.FindUIWidgetWithName(mod.stringkeys.pt, neutral_base);
        const enemy_base = mod.FindUIWidgetWithName(allKeys[flag], mod.FindUIWidgetWithName(mod.stringkeys.enemy));
        const enemy_letter = mod.FindUIWidgetWithName(mod.stringkeys.letter, enemy_base);
        const enemy_outline = mod.FindUIWidgetWithName(mod.stringkeys.circle_outline, enemy_base);
        const enemy_pt = mod.FindUIWidgetWithName(mod.stringkeys.pt, enemy_base);
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, ally_letter)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, ally_outline)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, ally_pt)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, neutral_letter)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, neutral_outline)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, neutral_pt)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, enemy_letter)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, enemy_outline)
        uiWidgetBlinking = mod.AppendToArray(uiWidgetBlinking, enemy_pt)
        mod.SetVariable(flagBlinking, mod.AppendToArray(mod.GetVariable(flagBlinking), uiWidgetBlinking))
    }
    else {
        let flagBlinkingArray = mod.GetVariable(flagBlinking)
       flagBlinkingArray = modlib.FilteredArray(flagBlinkingArray, (currentElement) => {
            const isNotTargetBase = mod.Not(mod.Equals(mod.GetUIWidgetName(currentElement), allKeys[flag]));
            const parent = mod.GetUIWidgetParent(currentElement);
            const isNotChildOfTarget = mod.Not(mod.Equals(mod.GetUIWidgetName(parent), allKeys[flag]));

            return mod.And(isNotTargetBase, isNotChildOfTarget);
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
        let uiWidgetBlinkingAlpha = mod.EmptyArray()
        for(let x = 0; x < sizeFlagBlinkingArray; x +=1) {
            const currentWidget =  mod.ValueInArray(flagBlinkingArray, x)
            if(x % 9 >= 3 && x % 3 != 0) {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUIWidgetBgAlpha(currentWidget))
            }
            else {
                uiWidgetBlinkingAlpha = mod.AppendToArray(uiWidgetBlinkingAlpha , mod.GetUITextAlpha(currentWidget))
            }
             
        }
        // Fade Out
        if(mod.CountOf(flagBlinkingArray) != 0) {
            for(let x = 1; x >= 0.3; x -= 0.1) {
                for(let y = 0; y < sizeFlagBlinkingArray; y += 1) {
                    if(y % 9 >= 3 && y % 3 != 0) {
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
                    if(y % 9 >= 3 && y % 3 != 0) {
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

    function makeAllyFlagUiLayer() {
        const allKeys = Object.keys(mod.stringkeys)
        const allyUiLayerName = mod.stringkeys.ally
        mod.AddUIContainer(allyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter)
        while(mod.FindUIWidgetWithName(allyUiLayerName) == null){}
        const allyUiLayer = mod.FindUIWidgetWithName(allyUiLayerName)
        for(let l = 0; l < 26; l +=1) {
            const baseUIName = allKeys[l]
            mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, allyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur)
            while(mod.FindUIWidgetWithName(baseUIName, allyUiLayer) == null){}
            const baseIU = mod.FindUIWidgetWithName(baseUIName, allyUiLayer)
            mod.AddUIText(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 40, blueColor, 0.8, mod.UIAnchor.Center)
            mod.AddUIText(mod.stringkeys.pt, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.pt), 36, blackColor, 0.9, mod.UIAnchor.Center)
            mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 17, blueColor, 0.8, mod.UIAnchor.Center)
    }
    }
    function makeNeutralFlagUiLayer() {
        const allKeys = Object.keys(mod.stringkeys)
        const neutralUiLayerName = mod.stringkeys.neutral
        mod.AddUIContainer(neutralUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter)
        while(mod.FindUIWidgetWithName(neutralUiLayerName) == null){}
        const neutralUiLayer = mod.FindUIWidgetWithName(neutralUiLayerName)
        for(let l = 0; l < 26; l +=1) {
            const baseUIName = allKeys[l]
            mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, neutralUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur)
            while(mod.FindUIWidgetWithName(baseUIName, neutralUiLayer) == null){}
            const baseIU = mod.FindUIWidgetWithName(baseUIName, neutralUiLayer)
            mod.AddUIContainer(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(35,35,0), mod.UIAnchor.Center, baseIU, true, 0, whiteColor, 0.8, mod.UIBgFill.Solid)
            mod.AddUIContainer(mod.stringkeys.pt, mod.CreateVector(0,0, 0), mod.CreateVector(31,31,0), mod.UIAnchor.Center, baseIU, true, 0, blackColor, 0.8, mod.UIBgFill.Solid)
            mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 20, whiteColor, 0.8, mod.UIAnchor.Center)
    }
    }
    function makeEnemyFlagUiLayer() {
        const allKeys = Object.keys(mod.stringkeys)
        const enemyUiLayerName = mod.stringkeys.enemy
        mod.AddUIContainer(enemyUiLayerName, mod.CreateVector(0,113,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter)
        while(mod.FindUIWidgetWithName(enemyUiLayerName) == null){}
        const enemyUiLayer = mod.FindUIWidgetWithName(enemyUiLayerName)
        for(let l = 0; l < 26; l +=1) {
            const baseUIName = allKeys[l]
            mod.AddUIContainer(baseUIName, mod.CreateVector(l * 42 - (25 * 21) ,0,0), mod.CreateVector(0,0,0), mod.UIAnchor.TopCenter, enemyUiLayer, true, 0 , mod.CreateVector(0,0,0), 1, mod.UIBgFill.Blur)
            while(mod.FindUIWidgetWithName(baseUIName, enemyUiLayer) == null){}
            const baseIU = mod.FindUIWidgetWithName(baseUIName, enemyUiLayer)
            mod.AddUIContainer(mod.stringkeys.circle_outline, mod.CreateVector(0,0, 0), mod.CreateVector(35,35,0), mod.UIAnchor.Center, baseIU, false, 0, redColor, 0.8, mod.UIBgFill.Solid)
            mod.AddUIContainer(mod.stringkeys.pt, mod.CreateVector(0,0, 0), mod.CreateVector(31,31,0), mod.UIAnchor.Center, baseIU, false, 0, blackColor, 0.8, mod.UIBgFill.Solid)
            mod.AddUIText(mod.stringkeys.letter, mod.CreateVector(0,0, 0), mod.CreateVector(0,0,0), mod.UIAnchor.Center, baseIU, false, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(allKeys[l]), 20, redColor, 0.8, mod.UIAnchor.Center)
    }
    }


export function OnGameModeStarted(): void {
    const allKeys = Object.keys(mod.stringkeys)
    let x = 0;
    for(const l of allKeys) {
        mod.AddUIText(mod.stringkeys.circle_outline, mod.CreateVector(x * 20 ,0, 45), mod.CreateVector(0,0,0), mod.UIAnchor.CenterLeft, mod.GetUIRoot(), true, 0, mod.CreateVector(0,0,0), 0, mod.UIBgFill.None, mod.Message(l), 205, mod.CreateVector(0.4,0.9,1), 0.8, mod.UIAnchor.Center)
        x += 1
    }
}
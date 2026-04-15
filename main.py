import json

dictionaire = {}
for i in range(65,91):
   dictionaire[chr(i)] = chr(i)
dictionaire["letter"] = "letter"
dictionaire["circle_outline"] = "circle_outline"
dictionaire["circle_inside"] = "circle_inside"
dictionaire["pt"] = "●"
dictionaire["rectangle_outline"] = "rectangle_outline"
dictionaire["rectangle_inside"] = "rectangle_inside"
dictionaire["enemy"] = "enemy"
dictionaire["neutral"] = "neutral"
dictionaire["ally"] = "ally"
dictionaire["natoFlags"] = "nato_flags"
dictionaire["paxFlags"] = "pax_flags"
file = open("Strings.json", "w")
json.dump(dictionaire, file)
dictionaire = {}
for i in range(0xFF000, 0xFFFFD):
   dictionaire[str(i)] = chr(i)
file = open("Strings2.json", "w")
json.dump(dictionaire, file)


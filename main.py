import json

dictionaire = {}
for i in range(65,91):
   dictionaire[chr(i)] = chr(i)
dictionaire["letter"] = "letter"
dictionaire["circle_outline"] = "circle_outline"
dictionaire["pt"] = "●"
dictionaire["enemy"] = "enemy"
dictionaire["neutral"] = "neutral"
dictionaire["ally"] = "ally"
dictionaire["base"] = "base"
dictionaire["diamond"] = "\u25c6"
file = open("Strings.json", "w")
json.dump(dictionaire, file)
dictionaire = {}
for i in range(0xFF000, 0xFFFFD):
   dictionaire[str(i)] = chr(i)
file = open("Strings2.json", "w")
json.dump(dictionaire, file)


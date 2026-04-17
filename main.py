import json

dictionaire = {}
for i in range(65,91):
   dictionaire[chr(i)] = chr(i)
for i in range(0,64):
   dictionaire["player_" + str(i)] = "player_" + str(i)
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
dictionaire["score_line_enemy"] = "score_line_enemy"
dictionaire["score_line_ally"] = "score_line_enemy"
dictionaire["score_backround_line_enemy"] = "score_backround_line_enemy"
dictionaire["score_backround_line_ally"] = "score_backround_line_ally"
dictionaire["score_base_score_num_enemy"] = "score_base_score_num_enemy"
dictionaire["score_base_score_num_ally"] = "score_base_score_num_ally"
dictionaire["score_num"] = "score_num"
dictionaire["score_outline_ally"] = "score_outline_ally"
dictionaire["score_outline_enemy"] = "score_outline_enemy"
dictionaire["score_outline_piece"] = "score_outline_piece"
dictionaire["contest_line"] = "contest_line"
dictionaire["contest_line_enemy"] = "contest_line_enemy"
dictionaire["contest_line_ally"] = "contest_line_ally"
dictionaire["contest_line_num_enemy"] = "contest_line_num_enemy"
dictionaire["contest_line_num_ally"] = "contest_line_num_ally"
dictionaire["on_flag_layer"] = "on_flag_layer"
dictionaire["capture_point_msg"] = "capture_point_msg"
dictionaire["defending"] = "DEFENDING"
dictionaire["capturing"] = "CAPTURING"
dictionaire["empty"] = "{}"
file = open("Strings.json", "w")
json.dump(dictionaire, file)
dictionaire = {}
for i in range(0xFF000, 0xFFFFD):
   dictionaire[str(i)] = chr(i)
file = open("Strings2.json", "w")
json.dump(dictionaire, file)


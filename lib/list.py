import yaml
import glob
import json

all_data = []

for file in glob.glob("../data/*.yml"):
    with open(file, "r") as f:
        yml = yaml.load(f)
    all_data.append(yml)

print json.dumps(all_data)

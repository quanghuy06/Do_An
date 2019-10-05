import paho.mqtt.client as mqtt
import json
from datetime import datetime
MQTT_Server = "localhost"
MQTT_Port = 1883

def on_connect(client, userdata, flags, rc):
    mqttc.subscribe("Button1")
    mqttc.subscribe("Button2")
    mqttc.subscribe("Slider")
def on_message(client, userdata, msg):
    if msg.topic == "Button1":
        val = json.loads(msg.payload)
        print("Subed Button1")
        print(val)
    if msg.topic == "Button2":
        val = json.loads(msg.payload)
        print("Subed Button2")
        print(val)
    if msg.topic == "Slider":
        val = json.loads(msg.payload)
        print("Subed Slider")
        print(val)

mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message
mqttc.username_pw_set(username="huytq",password="quanghuy@123")
mqttc.connect(MQTT_Server, MQTT_Port)

try:
    mqttc.loop_forever()
except KeyboardInterrupt:
    mqttc.loop_stop()
    print ("Client Disconnect")
    db.close()
    print ("Close Database")


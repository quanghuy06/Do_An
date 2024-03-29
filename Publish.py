import paho.mqtt.client as mqtt
import random,json
from datetime import datetime
from time import sleep

#MQTT settings
MQTT_Server = "192.168.0.107"
MQTT_Port = 1883
Keep_Alive_Interval = 45
MQTT_Topic = "Outside"

def on_connect(client, userdate, rc):
    if rc != 0:
        pass
        print("Unable to connect to MQTT Broker ...")
    else:
        print("Connect with MQTT Broker: " + str(MQTT_Server))

def on_publish(client, userdata, mid):
    pass

def on_disconnect(client, userdata, rc):
    if rc != 0:
        pass
mqttc = mqtt.Client()
mqttc.username_pw_set(username="huytq",password="quanghuy@123")
mqttc.on_connect = on_connect
mqttc.on_disconnect
mqttc.on_publish = on_publish
mqttc.connect(MQTT_Server, MQTT_Port, Keep_Alive_Interval)

def publish_To_Topic(topic, message):
    mqttc.publish(topic,message)
    print(("Published:" +str(message) + "" + "On MQTT Topic:" + str(topic)))
    print("")

def publish_Values_to_MQTT():
    temp = int(random.uniform(20,35))
    hum = int(random.uniform(20,90))
    P2_5 = float("{0:.2f}".format(random.uniform(0.01,0.1)))	
    Sensor_data = {}
    Sensor_data['Temperature'] = temp
    Sensor_data['Humidity'] = hum
    Sensor_data['PM2_5'] = P2_5
    Sensor_json_data = json.dumps(Sensor_data)
    print("Publishing Value: ")
    publish_To_Topic(MQTT_Topic, Sensor_json_data)
    sleep(5)

while True:
    publish_Values_to_MQTT()
    sleep(2)
	

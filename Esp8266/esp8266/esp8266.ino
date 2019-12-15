#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>;
#include <LiquidCrystal_I2C.h>;
#include <DHT.h>
#include <SharpGP2Y10.h>
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
//DUST Sensor
#define voPin A0
#define ledPin D4
SharpGP2Y10 dustSensor(voPin, ledPin);
LiquidCrystal_I2C lcd(0x27,16,2);
const char* ssid = "dungtq_plus";
const char* password = "0123456789";
const char* mqtt_server = "192.168.0.107";
const char* topic = "Room";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi(){
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  //Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("Huy","huytq","quanghuy@123")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      //Wait 5 seconds before retrying
      delay(1000);
    }
  }
}
 
void setup() {
  // Initialize Serial port
  Serial.begin(115200);
  dht.begin();
  lcd.init();
  lcd.backlight();
  setup_wifi();
  client.setServer(mqtt_server, 1883);   
  reconnect();
}

void loop() {
 float dustDensity = dustSensor.getDustDensity();
 int h = dht.readHumidity();
 int t = dht.readTemperature();
 int a,b;
 if ( t > 40){
  t = 20;
 }
 if (h>100){
  h = 50;
 }

  Serial.print(F("Tem:")); Serial.println(t);
  Serial.print(F("Hum:")); Serial.println(h);
  Serial.print(F("PM2_5:")); Serial.println(dustDensity);
  Serial.println(F("--------------------------------"));
  char message[100];
  char message_sensor[100];
  message_sensor[0]= '\0';
  message[0]= '\0';
  String tmp = "{\"Temperature\": " + String(t) + ",\"Humidity\": " + String(h) + ",\"PM2_5\": "+ String(dustDensity) +"}";
  strcat(message_sensor, String(tmp).c_str());
  Serial.println(message_sensor);
  client.publish(topic, message_sensor);
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  lcd.setCursor(0,0);
  lcd.print(F("Temp:"));
  lcd.print(t);
  lcd.setCursor(9,0);
  lcd.print(F("Humi:"));
  lcd.print(h);
  lcd.setCursor(0,1);
  lcd.print(F("PM2_5:"));
  lcd.print(dustDensity);
  delay(4000);
}

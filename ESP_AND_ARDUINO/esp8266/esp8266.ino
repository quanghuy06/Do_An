#include <SoftwareSerial.h>
SoftwareSerial s(D6,D5);
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>;
#include <LiquidCrystal_I2C.h>;
LiquidCrystal_I2C lcd(0x27,16,2);
const char* ssid = "dungtq_plus";
const char* password = "0123456789";
const char* mqtt_server = "192.168.0.104";

const char* topic = "Sensor";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi(){
  delay(10);
//  Serial.println();
//  Serial.print("Connecting to ");
//  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
//    Serial.print(".");
  }

//  Serial.println("");
//  Serial.println("WiFi connected");
//  Serial.println("IP address: ");
  //Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    //Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("Huy","huytq","quanghuy@123")) {
      //Serial.println("connected");
    } else {
      //Serial.print("failed, rc=");
      //Serial.print(client.state());
      //Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(1000);
    }
  }
}
 
void setup() {
  // Initialize Serial port
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  setup_wifi();
  client.setServer(mqtt_server, 1883);   
  reconnect();
  s.begin(115200);
  while (!Serial) continue;
}
 
void loop() {
  char message_sensor[100];
  StaticJsonBuffer<1000> jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(s);
  if (root == JsonObject::invalid())
  {
    return;  
  }
  //Serial.println("JSON received and parsed");
  //root.prettyPrintTo(Serial);
  int data1=root["CO"];
  int data2=root["SO2"];
  int data3=root["Temp"];
  int data4=root["Hum"];
  float data5=root["Dust"];
  message_sensor[0]= '\0';
  String tmp = "{\"temp\": " + String(data3) + ",\"hum\": " + String(data4) + ",\"CO\": " + String(data1) + ",\"SO2\": "+ String(data2) +",\"Dust\": "+ String(data5) +"}";
  strcat(message_sensor, String(tmp).c_str());
  //Serial.println(message_sensor);
  client.publish(topic, message_sensor);
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  lcd.setCursor(0,0);
  lcd.print(F("Temp:"));
  lcd.print(data3);
  lcd.setCursor(0,1);
  lcd.print(F("Hum:"));
  lcd.print(data4);
  lcd.setCursor(8,0);
  lcd.print(F("CO:"));
  lcd.print(data1);
  lcd.setCursor(8,8);
  lcd.print(F("SO2:"));
  lcd.print(data2);
}

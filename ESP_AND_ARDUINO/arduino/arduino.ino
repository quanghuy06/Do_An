#include <DHT.h>
#include <SharpGP2Y10.h>
#define DHTPIN A3
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
#define sensor_MQ7 A0
#define sensor_MQ136 A1
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
SoftwareSerial s(6,5); 
//DUST Sensor
#define voPin A2
#define ledPin 12
SharpGP2Y10 dustSensor(voPin, ledPin);

void setup() {
  Serial.begin(115200);
  dht.begin();
  s.begin(115200);
}

StaticJsonBuffer<1000> jsonBuffer;
JsonObject& root = jsonBuffer.createObject();

void loop() {
 float dustDensity = dustSensor.getDustDensity();
 int h = dht.readHumidity();
 int t = dht.readTemperature();
 int value1 = analogRead(sensor_MQ7);
 int value2 = analogRead(sensor_MQ136);
 float value3 = 0.3;
 if( isnan(t) || isnan(h) || isnan(value1) || isnan(value2)){
  return;
 }
 Serial.print(F("Tem:")); Serial.println(t);
 Serial.print(F("Hum:")); Serial.println(h);
 Serial.print(F("CO:")); Serial.println(value1);
 Serial.print(F("SO2:")); Serial.println(value2);
 Serial.print(F("Dust:")); Serial.println(dustDensity);
 Serial.println(F("--------------------------------"));
 root["CO"] = value1;
 root["SO2"] = value2;
 root["Temp"] = t;
 root["Hum"] = h;
 root["Dust"] = dustDensity;
 root.printTo(s);
 delay(9000);
}

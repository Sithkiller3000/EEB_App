import asyncio
import time
import json
import board
import busio
import RPi.GPIO as GPIO
from hx711 import HX711
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from websockets import serve

# Set GPIO mode to BCM (Broadcom SOC channel numbering)
GPIO.setmode(GPIO.BCM)

# Initialize HX711 (load cell amplifier) with data (DT) and clock (SCK) pins
waage2 = HX711(13, 26)  # dt, sck

# Initialize ADS1115 (analog-to-digital converter) for pressure sensors
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)
pressure_sensor1 = AnalogIn(ads, ADS.P0)
pressure_sensor2 = AnalogIn(ads, ADS.P1)
pressure_sensor3 = AnalogIn(ads, ADS.P2)

# Store connected WebSocket clients
connected_clients = set()

# Default reference unit for weight calculation (can be changed during calibration)
reference_unit_waage2 = 3.26

# Placeholder for zero/tare value
zero_value_waage2 = None

# Send live measurement data to a specific client over WebSocket
async def mess_loop_for_client(websocket):
    try:
        while True:
            gewicht2 = get_gewicht(waage2)
            druck = get_pressures()

            daten = {
                "type": "weight_data",
                "waage2": gewicht2,
                "drucksensoren": druck,
                "timestamp": time.time()
            }

            await websocket.send(json.dumps(daten))
            await asyncio.sleep(1)  # Update every second
    except:
        print("Measurement for client aborted")

# Perform a zero/tare measurement and store the raw value
def measure_zero(hx):
    global zero_value_waage2
    hx.reset()
    hx.set_gain(128)
    hx.set_reading_format("MSB", "MSB")
    time.sleep(1)
    zero_value_waage2 = hx.read_average(10)
    print(f"Zero value measured and stored: {zero_value_waage2}")
    return zero_value_waage2

# Calibrate the scale using a known weight
def calibrate_scale(hx, known_weight):
    global reference_unit_waage2, zero_value_waage2

    if zero_value_waage2 is None:
        raise ValueError("Zero value not set. Please perform zero measurement first.")

    print("Starting calibration...")

    hx.reset()
    hx.set_gain(128)
    hx.set_reading_format("MSB", "MSB")
    hx.tare()
    time.sleep(1)

    print(f"Using stored zero value: {zero_value_waage2}")
    time.sleep(2)  # Time to place the known weight

    raw_known = hx.read_average(5)
    print(f"Raw value with known weight: {raw_known}")

    reference_unit_waage2 = (raw_known - zero_value_waage2) / known_weight
    print(f"Calibration complete. Reference unit: {reference_unit_waage2:.2f}")
    return reference_unit_waage2

# Wait until HX711 is ready or timeout
def waage_ready(hx, timeout=120):
    start = time.time()
    while not hx.is_ready():
        if time.time() - start > timeout:
            raise TimeoutError("HX711 not ready.")
        time.sleep(0.1)

# Initialize the scale with or without known weight (for calibration)
def init_waage(hx, known_weight=None):
    try:
        waage_ready(hx)
        hx.reset()
        time.sleep(0.2)
        hx.set_gain(128)
        hx.set_reading_format("MSB", "MSB")
        time.sleep(0.1)

        if known_weight is not None:
            reference_unit = calibrate_scale(hx, known_weight)

        hx.set_reference_unit(reference_unit)
        print("Scale initialized with reference_unit:", reference_unit)
        hx.tare()
        return reference_unit
    except TimeoutError as e:
        print(f"Init error: {e}")
        return None
    except Exception as e:
        print(f"Init failed: {e}")

# Initialize all sensors (scale and pressure sensors)
def init_all():
    init_waage(waage2)
    print("Scale and pressure sensors ready.\n")

# Get average weight from HX711
def get_gewicht(hx, n=10):
    try:
        waage_ready(hx)
        readings = [hx.get_weight_A() for _ in range(n)]
        return round(sum(readings) / len(readings), 2)
    except Exception:
        return None

# Read voltage from all 3 pressure sensors
def get_pressures():
    try:
        return {
            "sensor1": round(pressure_sensor1.voltage, 3),
            "sensor2": round(pressure_sensor2.voltage, 3),
            "sensor3": round(pressure_sensor3.voltage, 3)
        }
    except Exception:
        return {
            "sensor1": None,
            "sensor2": None,
            "sensor3": None
        }

# Main continuous measurement loop that broadcasts data to all clients
async def mess_loop():
    while True:
        gewicht2 = get_gewicht(waage2)
        druck = get_pressures()

        daten = {
            "type": "weight_data",
            "waage2": gewicht2,
            "drucksensoren": druck,
            "timestamp": time.time()
        }

        json_daten = json.dumps(daten)
        print(json_daten)

        await broadcast(json_daten)
        await asyncio.sleep(1)

# Handle incoming WebSocket commands from clients
async def handle_command(command, data, websocket):
    global zero_value_waage2

    if command == "start_measuring":
        asyncio.create_task(mess_loop_for_client(websocket))
        return {
            "type": "response",
            "command": "start_measuring",
            "status": "success",
            "message": "Measurement started"
        }

    elif command == "start_zero_measurement":
        try:
            measure_zero(waage2)
            return {
                "type": "response",
                "command": "start_zero_measurement",
                "status": "success",
                "message": "Zero value measured",
                "zero_value": zero_value_waage2
            }
        except Exception as e:
            return {
                "type": "response",
                "command": "start_zero_measurement",
                "status": "error",
                "message": str(e)
            }

    elif command == "stop_measuring":
        return {
            "type": "response",
            "command": "stop_measuring",
            "status": "success",
            "message": "Measurement stopped"
        }

    elif command == "init":
        known_weight = float(data.get("known_weight"))
        ref_unit = init_waage(waage2, known_weight)
        await websocket.send(json.dumps({
            "type": "response",
            "command": "init",
            "status": "success" if ref_unit else "failed",
            "reference_unit": ref_unit
        }))

    elif command == "tare_scale":
        try:
            init_all()
            return {
                "type": "response",
                "command": "tare_scale",
                "status": "success",
                "message": "Scale tared"
            }
        except Exception as e:
            return {
                "type": "response",
                "command": "tare_scale",
                "status": "error",
                "message": str(e)
            }

    elif command == "calibrate_scale":
        known_weight = float(data.get("known_weight"))
        ref_unit = calibrate_scale(waage2, known_weight)
        if ref_unit:
            return {
                "type": "response",
                "command": "calibrate_scale",
                "status": "success",
                "reference_unit": round(ref_unit, 2),
                "message": "Calibration successful"
            }
        else:
            return {
                "type": "response",
                "command": "calibrate_scale",
                "status": "error",
                "message": "Calibration failed"
            }

    elif command == "get_current_weight":
        gewicht2 = get_gewicht(waage2)
        return {
            "type": "response",
            "command": "get_current_weight",
            "status": "success",
            "waage2": gewicht2,
            "timestamp": time.time()
        }

    else:
        return {
            "type": "response",
            "command": command,
            "status": "error",
            "message": f"Unknown command: {command}"
        }

# Broadcast data to all connected WebSocket clients
async def broadcast(message):
    to_remove = set()
    for client in connected_clients:
        try:
            await client.send(message)
        except:
            to_remove.add(client)
    connected_clients.difference_update(to_remove)

# Handle a WebSocket connection: receive commands, respond, and clean up on disconnect
async def websocket_handler(websocket):
    connected_clients.add(websocket)
    print("Client connected")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                command = data.get("command")
                print(f"Received command: {command}")

                response = await handle_command(command, data, websocket)
                if response is not None:
                    await websocket.send(json.dumps(response))
            except Exception as e:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
    except:
        pass
    finally:
        connected_clients.remove(websocket)
        print("Client disconnected")

# Start WebSocket server and begin broadcasting measurements
async def main():
    async with serve(websocket_handler, "0.0.0.0", 8765):
        print("WebSocket server started on port 8765")
        await mess_loop()

# Entry point
if __name__ == "__main__":
    asyncio.run(main())

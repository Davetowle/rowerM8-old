import { BleClient, type BleService, type BleCharacteristicProperties } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

export interface BleDevice {
  deviceId: string;
  name?: string;
  rssi?: number;
}

function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function ensureBleReady(): Promise<void> {
  await BleClient.initialize({ androidNeverForLocation: true });
}

export async function requestBlePermissions(): Promise<boolean> {
  if (!isAndroid()) return true;

  try {
    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      await BleClient.requestEnable();
    }
    return true;
  } catch {
    return false;
  }
}

export async function startScan(
  onDevice: (device: BleDevice) => void
): Promise<void> {
  await BleClient.requestLEScan({}, (result) => {
    onDevice({
      deviceId: result.device.deviceId,
      name: result.device.name,
      rssi: result.rssi,
    });
  });
}

export async function stopScan(): Promise<void> {
  await BleClient.stopLEScan();
}

function formatProperties(props: BleCharacteristicProperties): string[] {
  const labels: string[] = [];
  if (props.broadcast) labels.push("broadcast");
  if (props.read) labels.push("read");
  if (props.writeWithoutResponse) labels.push("writeWithoutResponse");
  if (props.write) labels.push("write");
  if (props.notify) labels.push("notify");
  if (props.indicate) labels.push("indicate");
  if (props.authenticatedSignedWrites) labels.push("authenticatedSignedWrites");
  if (props.reliableWrite) labels.push("reliableWrite");
  if (props.writableAuxiliaries) labels.push("writableAuxiliaries");
  if (props.extendedProperties) labels.push("extendedProperties");
  if (props.notifyEncryptionRequired) labels.push("notifyEncryptionRequired");
  if (props.indicateEncryptionRequired) labels.push("indicateEncryptionRequired");
  return labels;
}

export async function connectToDevice(deviceId: string): Promise<void> {
  await BleClient.connect(deviceId);
  const services = await BleClient.getServices(deviceId);

  console.log(`[BLE] Connected to ${deviceId}`);
  console.log(`[BLE] Discovered ${services.length} service(s):`);

  for (const service of services) {
    console.log(`  Service: ${service.uuid}`);
    for (const char of service.characteristics) {
      const props = formatProperties(char.properties);
      console.log(`    Characteristic: ${char.uuid}`);
      console.log(`      Properties: ${props.join(", ")}`);
      for (const descriptor of char.descriptors) {
        console.log(`      Descriptor: ${descriptor.uuid}`);
      }
    }
  }
}

export async function subscribeToNotifications(
  deviceId: string,
  serviceUUID: string,
  characteristicUUID: string
): Promise<void> {
  await BleClient.startNotifications(
    deviceId,
    serviceUUID,
    characteristicUUID,
    (value: DataView) => {
      const bytes: number[] = [];
      for (let i = 0; i < value.byteLength; i++) {
        bytes.push(value.getUint8(i));
      }
      console.log(
        `[BLE] Notification on ${characteristicUUID}: [${bytes.join(", ")}]`
      );
    }
  );
  console.log(
    `[BLE] Subscribed to notifications on ${serviceUUID} / ${characteristicUUID}`
  );
}

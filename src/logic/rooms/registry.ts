import { RoomGenerator } from './types';

const registry = new Map<string, RoomGenerator>();

export function registerRoomGenerator(type: string, generator: RoomGenerator) {
  registry.set(type, generator);
}

export function getRoomGenerator(type: string): RoomGenerator | undefined {
  return registry.get(type);
}

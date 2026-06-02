import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

export function publish(event) {
  emitter.emit(event.type, event);
}

export function subscribe(eventType, handler) {
  const wrapped = (event) => {
    handler(event);
  };
  emitter.on(eventType, wrapped);
  return () => emitter.off(eventType, wrapped);
}

import "reflect-metadata";
import { PropertyKey, Dep, DepResolvePhase, ProvideInstanceSubscriber } from "./types";
import { RootZoneId } from "./consts";
import state from "./state";

const {
  instances,
  overrides,
  resolvePhases,
  zoneIndex,
  zoneParentIndex
} = state;

export async function zone<T = void>(callback: () => T): Promise<void> {
  const asyncHooks = (!(process as any).browser) ? require("async_hooks") : null; // With love to Webpack
  if (!asyncHooks) {
    await callback();
    return;
  }
  if (typeof state.asyncHook === "undefined") {
    state.asyncHook = asyncHooks.createHook({
      init(asyncId: number, _type: any, triggerAsyncId: number) {
        const rootAsyncId = zoneIndex[triggerAsyncId];
        if (rootAsyncId) {
          zoneIndex[asyncId] = rootAsyncId;
        }
      },
      before(asyncId: number) {
        state.zoneId = zoneIndex[asyncId] || RootZoneId;
      },
      destroy(asyncId: number) {
        delete zoneIndex[asyncId];
      },
    }).enable();
  }
  return new Promise((resolve, reject) => {
    process.nextTick(async () => {
      const asyncId = asyncHooks.executionAsyncId();
      zoneParentIndex[asyncId] = zoneIndex[asyncId] || RootZoneId;
      state.zoneId = zoneIndex[asyncId] = asyncId;
      try {
        await callback();
        resolve();
      } catch (error) {
        reject(error);
      }
      delete zoneParentIndex[asyncId];
      resetZone(asyncId);
    });
  });
}

export function getZoneId(): number {
  return state.zoneId;
}

export function getZoneParentId(zoneId: number) {
  return zoneParentIndex[zoneId];
}

export function provideDecoratorFactory(subscriber?: ProvideInstanceSubscriber) {
  function provide(target: object, propertyKey: PropertyKey): any;
  function provide(dep: Dep): (target: object, propertyKey: PropertyKey) => any;
  function provide(targetOrDep: any, propertyKey?: any): any {
    if (typeof propertyKey === "undefined") {
      const dep: Dep = targetOrDep;
      return (_target: object, propertyKey: PropertyKey): any => (
        createProvideDescriptor(dep, propertyKey, subscriber)
      );
    }
    return createProvideDescriptor(
      Reflect.getMetadata("design:type", targetOrDep, propertyKey),
      propertyKey,
      subscriber
    );
  }
  return provide;
}

export const provide = provideDecoratorFactory();

export function resolve<T>(dep: Dep<T>): T {
  let instance = getInstance(dep);
  if (!instance) {
    const OverrideDep = getOverride(dep);
    if (typeof OverrideDep !== "undefined") {
      setInstance(dep, instance = resolve(OverrideDep));
      return instance;
    }
    setResolvePhase(dep, DepResolvePhase.Start);
    if (typeof dep === "function") {
      instance = (typeof dep.prototype === "undefined")
        ? (dep as () => T)()
        : new (dep as new () => T)();
    } else {
      instance = dep;
    }
    setInstance(dep, instance);
    setResolvePhase(dep, DepResolvePhase.Finish);
  }
  return instance;
}

export function override(from: Dep, to: Dep) {
  setOverride(from, to);
}

export function assign(dep: Dep, instance: any) {
  setInstance(dep, instance);
  const OverrideDep = getOverride(dep);
  if (typeof OverrideDep !== "undefined") {
    assign(OverrideDep, instance);
  }
}

export function cleanup() {
  Object.keys(instances).forEach((id) => {
    instances[id].clear();
    delete instances[id];
  });
  Object.keys(resolvePhases).forEach((id) => {
    resolvePhases[id].clear();
    delete resolvePhases[id];
  });
}

export function reset() {
  cleanup();
  Object.keys(overrides).forEach((id) => {
    overrides[id].clear();
    delete overrides[id];
  });
}

export function resetZone(zoneId: number) {
  if (instances[zoneId]) {
    instances[zoneId].clear();
    delete instances[zoneId];
  }
  if (resolvePhases[zoneId]) {
    resolvePhases[zoneId].clear();
    delete resolvePhases[zoneId];
  }
  if (overrides[zoneId]) {
    overrides[zoneId].clear();
    delete overrides[zoneId];
  }
}

export function getZoneInstances() {
  const { zoneId } = state;
  if (typeof instances[zoneId] === "undefined") {
    return [];
  }
  return [ ...instances[zoneId].values() ];
}

function createProvideDescriptor(dep: Dep, propertyKey: PropertyKey, subscriber?: ProvideInstanceSubscriber) {
  return {
    get() {
      const instance = resolve(dep);
      Object.defineProperty(this, propertyKey, {
        value: instance,
        enumerable: true,
        configurable: false,
        writable: false,
      });
      if (subscriber) {
        subscriber(this, instance);
      }
      return instance;
    },
    enumerable: true,
    configurable: true,
  };
}

function setResolvePhase(dep: Dep, phase: DepResolvePhase) {
  const { zoneId } = state;
  if (typeof resolvePhases[zoneId] === "undefined") {
    resolvePhases[zoneId] = new Map();
  }
  const currentPhase = resolvePhases[zoneId].get(dep);
  if (currentPhase === DepResolvePhase.Start && phase === DepResolvePhase.Start) {
    throw new Error("Circular dependency detected");
  }
  if (phase === DepResolvePhase.Finish) {
    resolvePhases[zoneId].delete(dep);
  } else {
    resolvePhases[zoneId].set(dep, phase);
  }
}

function setInstance(dep: Dep, instance: any) {
  const { zoneId } = state;
  if (typeof instances[zoneId] === "undefined") {
    instances[zoneId] = new Map();
  }
  instances[zoneId].set(dep, instance);
}

function getInstance(dep: Dep): any {
  const { zoneId } = state;
  if (typeof instances[zoneId] !== "undefined") {
    return instances[zoneId].get(dep);
  }
}

function setOverride(from: Dep, to: Dep) {
  const { zoneId } = state;
  if (typeof overrides[zoneId] === "undefined") {
    overrides[zoneId] = new Map();
  }
  overrides[zoneId].set(from, to);
}

function getOverride(from: Dep): Dep | undefined {
  const { zoneId } = state;
  let id = zoneId;
  while (typeof id !== "undefined") {
    if (typeof overrides[id] !== "undefined") {
      const to = overrides[id].get(from);
      if (typeof to !== "undefined") {
        return to;
      }
    }
    id = zoneParentIndex[id];
  }
}
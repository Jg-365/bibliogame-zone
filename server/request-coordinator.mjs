const inflight = new Map();

export const runDeduped = async (key, factory) => {
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = Promise.resolve()
    .then(factory)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
};

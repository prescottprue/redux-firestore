/* eslint-disable import/prefer-default-export */
/**
 * Async await wrapper for easy error handling
 * @param  {Promise} promise - Promise to wrap responses of
 * @return {Promise} Resolves and rejects with an array
 */
export function to(promise) {
  return promise.then(data => [null, data]).catch(err => [err]);
}

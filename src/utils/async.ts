/* eslint-disable import/prefer-default-export */
/**
 * Async await wrapper for easy error handling
 * @param  {Promise} promise - Promise to wrap responses of
 * @return {Promise} Resolves and rejects with an array
 */
export function to<T, U = Error> (
  promise: Promise<T>,
  errorExt?: object
): Promise<[U | null, T | undefined]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        Object.assign(err, errorExt);
      }

      return [err, undefined];
    });
}

import { toBigNumber } from '@q-dev/utils';

export function toWeiWithDecimals (value: number | string, decimals = 0) {
  return toBigNumber(value)
    .multipliedBy(10 ** decimals)
    .toFixed();
}

export function fromWeiWithDecimals (value: number | string, decimals = 0) {
  return toBigNumber(value)
    .dividedBy(10 ** decimals)
    .toFixed();
}

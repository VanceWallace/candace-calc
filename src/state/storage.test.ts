import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { load } from './storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

const stored = (value: object | null) =>
  (AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>).mockResolvedValue(value && JSON.stringify(value));

describe('focus view setting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is on for a new install', async () => {
    stored(null);
    expect((await load()).settings.focusView).toBe(true);
  });

  test('is on when saved settings predate it', async () => {
    stored({ paper: 'wide' });
    expect((await load()).settings.focusView).toBe(true);
  });

  test('stays off when the user turned it off', async () => {
    stored({ focusView: false });
    expect((await load()).settings.focusView).toBe(false);
  });
});

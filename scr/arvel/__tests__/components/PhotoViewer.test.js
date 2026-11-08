import React from 'react';
import { Animated } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PhotoViewer from '../../src/components/PhotoViewer';

afterEach(() => jest.restoreAllMocks());

it('opens the real viewer with native gesture handlers and closes', () => {
  // Use production native-driver event objects, not Jest's JS fallback.
  jest.spyOn(Animated, 'event').mockImplementation(() => ({ __isNative: true }));
  const onClose = jest.fn();
  render(<PhotoViewer uri="https://example.com/product.jpg" onClose={onClose} />);
  fireEvent.press(screen.getByLabelText('Закрыть фото'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

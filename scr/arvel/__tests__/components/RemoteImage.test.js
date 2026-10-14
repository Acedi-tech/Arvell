import React from 'react';
import { Image, Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import RemoteImage from '../../src/components/RemoteImage';

const img = () => screen.UNSAFE_queryAllByType(Image)[0] || null;

describe('RemoteImage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('без адреса — заглушка', () => {
    render(<RemoteImage uri={null} placeholder={<Text>нет фото</Text>} />);
    expect(screen.getByText('нет фото')).toBeTruthy();
    expect(img()).toBeNull();
  });

  it('пока грузится — заглушка поверх, после onLoad — только фото', () => {
    render(<RemoteImage uri="http://x/a.jpg" placeholder={<Text>грузим</Text>} />);
    expect(screen.getByText('грузим')).toBeTruthy();
    act(() => img().props.onLoad());
    expect(screen.queryByText('грузим')).toBeNull();
  });

  it('ошибка загрузки -> ещё две попытки с новым адресом -> заглушка', () => {
    render(<RemoteImage uri="http://x/a.jpg" placeholder={<Text>нет фото</Text>} />);
    expect(img().props.source.uri).toBe('http://x/a.jpg');
    act(() => img().props.onError());
    act(() => { jest.advanceTimersByTime(1500); });
    expect(img().props.source.uri).toBe('http://x/a.jpg?r=1');
    act(() => img().props.onError());
    act(() => { jest.advanceTimersByTime(1500); });
    expect(img().props.source.uri).toBe('http://x/a.jpg?r=2');
    act(() => img().props.onError());
    act(() => { jest.advanceTimersByTime(5000); });
    expect(img()).toBeNull();
    expect(screen.getByText('нет фото')).toBeTruthy();
  });

  it('повтор после ошибки загружается — фото на месте', () => {
    render(<RemoteImage uri="http://x/a.jpg" placeholder={<Text>нет фото</Text>} />);
    act(() => img().props.onError());
    act(() => { jest.advanceTimersByTime(1500); });
    act(() => img().props.onLoad());
    expect(img().props.source.uri).toBe('http://x/a.jpg?r=1');
    expect(screen.queryByText('нет фото')).toBeNull();
  });
});

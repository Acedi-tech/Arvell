// Дизайн-система Editorial: базовые компоненты и витрина arvell://dev/components.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => require('../helpers/navMock').module);
const { createNavigation } = require('../helpers/navMock');

import DevComponentsScreen from '../../src/screens/DevComponentsScreen';
import Button from '../../src/components/Button';
import Chip from '../../src/components/Chip';
import TextField from '../../src/components/TextField';
import { withFont } from '../../src/components/AppText';
import { fonts } from '../../src/theme';

describe('ДИЗАЙН-СИСТЕМА', () => {
  it('Шрифт подбирается по жирности, явный fontFamily не трогается', () => {
    expect(withFont({ fontWeight: '700' })).toEqual({ fontFamily: fonts.bold });
    expect(withFont({ fontWeight: '600', color: 'red' })).toEqual({ fontFamily: fonts.semibold, color: 'red' });
    expect(withFont(undefined)).toEqual({ fontFamily: fonts.regular });
    expect(withFont({ fontFamily: fonts.mono, fontWeight: '800' })).toEqual({ fontFamily: fonts.mono });
  });

  it('Button: нажатие и неактивное состояние', () => {
    const onPress = jest.fn();
    const { rerender } = render(<Button title="Купить" onPress={onPress} />);
    fireEvent.press(screen.getByText('Купить'));
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(<Button title="Купить" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Купить'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Chip: стрелка и выбранное состояние', () => {
    render(<Chip label="NIKE" active onPress={() => {}} />);
    expect(screen.getByText('NIKE ↗')).toBeTruthy();
    expect(screen.getByRole('button').props.accessibilityState.selected).toBe(true);
  });

  it('TextField: счётчик и ошибка', () => {
    render(<TextField label="Описание" counter maxLength={1000} value="Привет" error="Слишком коротко" onChangeText={() => {}} />);
    expect(screen.getByText('6 / 1000')).toBeTruthy();
    expect(screen.getByText('Слишком коротко')).toBeTruthy();
  });

  it('Витрина: открывает диалог и экран успеха', () => {
    const navigation = createNavigation();
    render(<DevComponentsScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Диалог: удалить'));
    expect(screen.getByText('Удалить объявление?')).toBeTruthy();
    fireEvent.press(screen.getByText('Отмена'));
    fireEvent.press(screen.getByText('Экран успеха'));
    expect(screen.getByText('Товар опубликован')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Назад'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('ВХОД — Editorial', () => {
  const WelcomeScreen = require('../../src/screens/WelcomeScreen').default;

  it('Заголовок говорит, зачем нужен вход; крестик закрывает окно', () => {
    const navigation = createNavigation();
    const root = { canGoBack: jest.fn(() => true), goBack: jest.fn() };
    navigation.getParent = jest.fn(() => root);
    render(<WelcomeScreen navigation={navigation} route={{ params: { reason: 'Войдите, чтобы видеть чаты' } }} />);
    expect(screen.getByText('Войдите, чтобы видеть чаты')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Закрыть'));
    expect(root.goBack).toHaveBeenCalled();
  });

  it('Без причины — общий заголовок, без крестика на холодном старте', () => {
    const navigation = createNavigation();
    navigation.getParent = jest.fn(() => ({ canGoBack: () => false }));
    render(<WelcomeScreen navigation={navigation} route={{}} />);
    expect(screen.getByText('Войдите в ARVELL')).toBeTruthy();
    expect(screen.queryByLabelText('Закрыть')).toBeNull();
  });
});

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import ConversationScreen from '../screens/ConversationScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import WriteReviewScreen from '../screens/WriteReviewScreen';
import AnimatedSplash from '../components/AnimatedSplash';

const Stack = createNativeStackNavigator();

// Модалка авторизации: открывается поверх MainTabs, когда гость пытается
// купить товар, зайти в чат или в профиль. Как только вход завершён
// (isLoggedIn стал true), сама закрывается — пользователь возвращается туда,
// откуда её открыл.
function AuthModal({ navigation }) {
  const { isLoggedIn } = useAuth();
  useEffect(() => {
    if (!isLoggedIn) return;
    // Анкета, открытая на холодном старте (pendingUser), — первый экран стека:
    // под ней нет MainTabs, и goBack() ничего не делал — человек оставался на
    // «Расскажите о себе», хотя регистрация прошла (Galaxy S9, 21.10).
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [isLoggedIn, navigation]);
  return <AuthNavigator />;
}

export default function RootNavigator() {
  const { bootstrapping, pendingUser } = useAuth();
  const [splashPlayed, setSplashPlayed] = useState(false);

  // Заставка холодного старта держится, пока идёт проверка сохранённой
  // сессии (GET /me по токену из хранилища), и не короче своей анимации —
  // так «А» всегда дорисовывается целиком, даже если сессия отозвалась мгновенно.
  if (bootstrapping || !splashPlayed) {
    return <AnimatedSplash onFinish={() => setSplashPlayed(true)} />;
  }

  // Без входа доступны каталог и лента. Избранное, «Чат» и «Профиль» требуют
  // авторизации: избранное живёт на бэкенде в /me/favorites, гостю его просто
  // негде хранить. Плюс точечные запросы входа — при попытке купить товар или
  // написать продавцу (см. MainTabs и ProductScreen).
  return (
    // Аккаунт создан, но имя не собрано (см. AuthContext) — открываем модалку
    // входа сразу на ProfileSetup, а не оставляем человека гостем молча.
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={pendingUser ? 'Auth' : 'Main'}>
      <Stack.Screen name="Main" component={MainTabs} />
      {/* Вынесен из вкладочных стеков в корневой навигатор: экран диалога
          занимает весь экран, а таббар просто не рендерится под ним —
          без ручного скрытия tabBarStyle, которое давало рассинхрон с
          переходом (поле ввода "прыгало" при открытии, таббар мигал при
          закрытии). */}
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      {/* Отзывы открываются с товара, магазина и из сделок в разных вкладках —
          держим их в корне, как чат, чтобы «Назад» всегда вёл туда, откуда пришли. */}
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen
        name="Auth"
        component={AuthModal}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

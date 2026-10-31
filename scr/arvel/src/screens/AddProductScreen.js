// Новый товар / редактирование (Editorial, design/v3-c.jsx → V3AddProduct).
// route.params.editId — редактирование своего объявления (PATCH /products/{id}).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing, font, type } from '../theme';
import { CameraIcon, CloseIcon, ImageIcon, SearchIcon } from '../components/Icons';
import ChevronDown from '../components/ChevronDown';
import CheckIcon from '../components/CheckIcon';
import Header from '../components/Header';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import KeyboardAware from '../components/KeyboardAware';
import SuccessOverlay from '../components/SuccessOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import { useMyListings } from '../context/MyListingsContext';
import { useAppConfig, useMoney } from '../context/AppConfigContext';
import { listCategories, listBrands } from '../api/catalog';
import { createProduct, getProduct, updateProduct, addProductImage, deleteProductImage } from '../api/products';
import { uploadImage } from '../api/media';
import { toUploadAsset, prepareForUpload } from '../utils/imageUpload';
import { resolveMediaUrl } from '../utils/media';
import { sizeOptionsFor, sizeSystemsForCategory } from '../utils/sizes';

const NO_BRAND = '';
const MAX_DESCRIPTION = 1000;

// Образцы цветов для кружков. Значения — enum Color из API.
const SWATCH = {
  black: '#111111', white: '#f2f2f2', grey: '#8a8a8a', beige: '#d8c3a0', brown: '#7a5232',
  red: '#c23a2e', orange: '#e07b2a', yellow: '#f0c419', green: '#3f7a4a', blue: '#2b4fa8',
  purple: '#6b3fa0', pink: '#e58fb5', gold: '#c9a227', silver: '#c0c0c0',
};

function Swatch({ value, size = 26 }) {
  if (value === 'multicolor') {
    const r = size / 2;
    return (
      <Svg width={size} height={size}>
        <Path d={`M${r} ${r} L${r} 0 A${r} ${r} 0 0 1 ${size} ${r} Z`} fill="#c23a2e" />
        <Path d={`M${r} ${r} L${size} ${r} A${r} ${r} 0 0 1 ${r} ${size} Z`} fill="#f0c419" />
        <Path d={`M${r} ${r} L${r} ${size} A${r} ${r} 0 0 1 0 ${r} Z`} fill="#3f7a4a" />
        <Path d={`M${r} ${r} L0 ${r} A${r} ${r} 0 0 1 ${r} 0 Z`} fill="#2b4fa8" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} fill={SWATCH[value] || '#555'} stroke="rgba(255,255,255,0.15)" />
    </Svg>
  );
}

function Label({ children, required }) {
  return (
    <Text style={styles.label}>
      {children}{required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

// Поле-выбор: тап открывает шторку со списком (и поиском, если вариантов много).
function SelectField({ label, required, value, placeholder, options, title, searchable, emptyText }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.value === value);
  const shown = searchable && q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;
  return (
    <View>
      <Label required={required}>{label}</Label>
      <Pressable style={styles.field} onPress={() => { setQ(''); setOpen(true); }}>
        <Text style={[styles.fieldText, !selected && styles.fieldTextFaint]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={title || label}>
        {searchable && (
          <View style={[styles.field, { marginBottom: spacing.sm }]}>
            <SearchIcon size={17} color={colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Поиск"
              placeholderTextColor={colors.textFaint}
              selectionColor={colors.accent}
              style={styles.fieldInput}
            />
          </View>
        )}
        <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
          {shown.length === 0 && <Text style={styles.sheetEmpty}>{emptyText || 'Ничего не найдено'}</Text>}
          {shown.map((opt) => (
            <Pressable
              key={String(opt.value)}
              style={styles.sheetRow}
              onPress={() => { setOpen(false); opt.onSelect(); }}
            >
              <Text style={[styles.sheetText, value === opt.value && { color: colors.accent }]}>{opt.label}</Text>
              {value === opt.value && <CheckIcon size={18} color={colors.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function ChoiceChip({ label, active, onPress, wide }) {
  return (
    <Pressable
      style={[styles.choice, wide && styles.choiceWide, active && styles.choiceActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

// Текст ошибки API + подсказки по полям (422 приходит с fields[]).
function describeError(e, editing) {
  const base = e?.message || (editing ? 'Не удалось сохранить изменения. Попробуйте ещё раз.' : 'Не удалось опубликовать товар. Попробуйте ещё раз.');
  const fields = Array.isArray(e?.fields)
    ? e.fields.map((f) => `${f.field}: ${f.message || f.code}`).join('\n')
    : '';
  return fields ? `${base}\n${fields}` : base;
}

export default function AddProductScreen({ navigation, route }) {
  const editId = route?.params?.editId || null;
  const editing = !!editId;
  const { reloadAfterChange } = useMyListings();
  const { symbol: currencySign } = useMoney();
  const {
    colors: colorOptions, conditions, sizeSystems,
    maxImages, maxImageBytes, maxImageWidth, maxImageHeight, loading: configLoading, reload: reloadConfig,
  } = useAppConfig();
  const scrollRef = useRef(null);
  // uri -> file_url: если публикация упала уже после загрузки фото,
  // повторная попытка не заливает те же файлы заново.
  const uploadedRef = useRef({});

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [refsError, setRefsError] = useState(null);

  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState(NO_BRAND);
  // [{ uri, contentType, filename }] — новые; у фото редактируемого товара
  // есть imageId и remoteUrl (уже на сервере).
  const [photos, setPhotos] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('');
  const [sizeSystem, setSizeSystem] = useState('');
  const [sizeValue, setSizeValue] = useState('');
  const [waist, setWaist] = useState('');
  const [inseam, setInseam] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // «Назад» (кнопка, жест, системная кнопка Android) с заполненной формой
  // закрывал экран молча, и всё введённое пропадало. Теперь сначала спрашиваем.
  // Редактирование: исходные значения, чтобы понять, есть ли правки.
  const [initial, setInitial] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(editing);
  const snapshot = JSON.stringify([categoryId, brandId, title.trim(), color, sizeSystem, sizeValue, waist, inseam, price, condition, description.trim()]);
  const dirty = editing
    ? (initial != null && (snapshot !== initial || removedImageIds.length > 0 || photos.some((p) => !p.imageId)))
    : photos.length > 0 || categoryId !== '' || brandId !== NO_BRAND
      || [title, color, sizeSystem, sizeValue, waist, inseam, price, condition, description]
        .some((v) => String(v).trim() !== '');
  const [pendingLeave, setPendingLeave] = useState(null);
  const leaveGuard = useRef({ dirty, submitting, allowLeave: false });
  leaveGuard.current.dirty = dirty;
  leaveGuard.current.submitting = submitting;
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    const g = leaveGuard.current;
    if (!g.dirty || g.submitting || g.allowLeave) return;
    e.preventDefault();
    setPendingLeave(e.data.action);
  }), [navigation]);

  const loadRefs = useCallback(() => {
    setRefsError(null);
    Promise.all([listCategories(), listBrands({ limit: 100 })])
      .then(([cats, brs]) => {
        setCategories(cats.data || []);
        setBrands(brs.data || []);
      })
      .catch((e) => setRefsError(e));
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  // Редактирование: подставляем данные товара в форму.
  useEffect(() => {
    if (!editId) return undefined;
    let alive = true;
    getProduct(editId)
      .then((prod) => {
        if (!alive || !prod) return;
        const wi = /^(\d+)x(\d+)$/.exec(prod.size_value || '');
        const v = {
          categoryId: prod.category?.id || '',
          brandId: prod.brand?.id || NO_BRAND,
          title: prod.title || '',
          color: prod.color || '',
          sizeSystem: prod.size_system || '',
          sizeValue: wi ? '' : (prod.size_value || ''),
          waist: wi ? wi[1] : '',
          inseam: wi ? wi[2] : '',
          price: prod.price_minor != null ? String(Math.round(prod.price_minor / 100)) : '',
          condition: prod.condition || '',
          description: prod.description || '',
        };
        setCategoryId(v.categoryId); setBrandId(v.brandId); setTitle(v.title); setColor(v.color);
        setSizeSystem(v.sizeSystem); setSizeValue(v.sizeValue); setWaist(v.waist); setInseam(v.inseam);
        setPrice(v.price); setCondition(v.condition); setDescription(v.description);
        setPhotos([...(prod.images || [])]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((img) => ({ uri: resolveMediaUrl(img.url), imageId: img.id, remoteUrl: img.url })));
        setInitial(JSON.stringify([v.categoryId, v.brandId, v.title.trim(), v.color, v.sizeSystem, v.sizeValue, v.waist, v.inseam, v.price, v.condition, v.description.trim()]));
      })
      .catch((e) => { if (alive) setSubmitError(e?.message || 'Не удалось загрузить объявление.'); })
      .finally(() => { if (alive) setLoadingEdit(false); });
    return () => { alive = false; };
  }, [editId]);

  // Товар можно привязать только к листовой категории; показываем путь
  // целиком («Одежда › Куртки»), чтобы одинаковые названия не путались.
  const categoryOptions = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const labelOf = (c) => {
      const names = [];
      for (let cur = c, guard = 0; cur && guard < 10; cur = byId.get(cur.parent_id), guard += 1) {
        names.unshift(cur.name);
      }
      return names.join(' › ');
    };
    return categories
      .filter((c) => c.is_leaf)
      .map((c) => ({ value: c.id, label: labelOf(c) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }, [categories]);

  const brandOptions = useMemo(
    () => [{ value: NO_BRAND, label: 'Без бренда' }, ...brands.map((b) => ({ value: b.id, label: b.name }))],
    [brands]
  );
  const colorChoices = useMemo(() => colorOptions.map((c) => ({ value: c.value, label: c.label })), [colorOptions]);
  // Названия и slug всех уровней выбранной категории — по ним отбираем
  // подходящие системы размеров (см. sizeSystemsForCategory).
  const categoryPath = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const out = [];
    for (let cur = byId.get(categoryId), guard = 0; cur && guard < 10; cur = byId.get(cur.parent_id), guard += 1) {
      out.push(cur.name, cur.slug);
    }
    return out.filter(Boolean);
  }, [categories, categoryId]);
  const allowedSystems = useMemo(
    () => sizeSystemsForCategory(sizeSystems, categoryPath),
    [sizeSystems, categoryPath]
  );
  const systemChoices = useMemo(() => allowedSystems.map((s) => ({ value: s.system, label: s.label })), [allowedSystems]);

  // Сменили категорию: система, которая к ней не подходит, сбрасывается, а
  // единственный вариант (у сумок — «без размера») выбирается сам.
  useEffect(() => {
    // Пока категории не загрузились, системы ещё не известны — не трогаем
    // размер, подставленный из редактируемого товара.
    if (!categories.length) return;
    if (allowedSystems.length === 1) {
      if (sizeSystem !== allowedSystems[0].system) {
        setSizeSystem(allowedSystems[0].system);
        setSizeValue('');
      }
    } else if (sizeSystem && !allowedSystems.some((s) => s.system === sizeSystem)) {
      setSizeSystem('');
      setSizeValue('');
    }
  }, [allowedSystems, sizeSystem, categories.length]);

  const rule = useMemo(() => allowedSystems.find((s) => s.system === sizeSystem) || null, [allowedSystems, sizeSystem]);
  const sizeChoices = useMemo(() => sizeOptionsFor(rule).map((v) => ({ value: v, label: v })), [rule]);

  const inRange = (raw, min, max) => /^\d+$/.test(raw) && Number(raw) >= min && Number(raw) <= max;
  const waistInseamValid = rule?.input_type === 'waist_inseam'
    && inRange(waist, rule.min_waist, rule.max_waist)
    && inRange(inseam, rule.min_inseam, rule.max_inseam);

  const sizeReady = !rule ? false
    : rule.input_type === 'none' ? true
    : rule.input_type === 'waist_inseam' ? waistInseamValid
    : sizeValue !== '';

  const canPublish =
    !submitting && !loadingEdit && (!editing || dirty) &&
    categoryId !== '' &&
    photos.length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    color !== '' &&
    condition !== '' &&
    sizeReady &&
    Number(price) > 0;

  const onSelectSystem = (value) => {
    setSizeSystem(value);
    setSizeValue('');
    setWaist('');
    setInseam('');
  };

  // --- Фото ---

  const addPhotos = async (source = 'library') => {
    setPhotoSheet(false);
    const room = maxImages - photos.length;
    if (room <= 0) {
      Alert.alert('Достаточно фото', `В объявлении может быть не больше ${maxImages} фото.`);
      return;
    }
    const camera = source === 'camera';
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        camera ? 'Нет доступа к камере' : 'Нет доступа к фото',
        camera ? 'Разрешите доступ к камере в настройках, чтобы сделать фото.' : 'Разрешите доступ к галерее в настройках, чтобы выбрать фото.',
      );
      return;
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: room,
        quality: 0.8,
      });
    if (res.canceled) return;

    // Размер и формат не проверяем: перед загрузкой каждое фото ужимается под
    // лимиты хранилища (prepareForUpload), иначе оно отвечало 422.
    const accepted = res.assets.map(toUploadAsset);
    setPhotos((prev) => [...prev, ...accepted].slice(0, maxImages));
  };

  const removePhoto = (photo) => {
    if (photo.imageId) setRemovedImageIds((ids) => [...ids, photo.imageId]);
    setPhotos((prev) => prev.filter((p) => p.uri !== photo.uri));
  };

  // --- Публикация ---

  const publish = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const urls = [];
      for (let i = 0; i < photos.length; i += 1) {
        const p = photos[i];
        if (p.remoteUrl) { urls.push(p.remoteUrl); continue; }
        if (!uploadedRef.current[p.uri]) {
          setProgress(`Загрузка фото ${i + 1} из ${photos.length}…`);
          uploadedRef.current[p.uri] = await uploadImage(await prepareForUpload(p, {
            maxWidth: maxImageWidth, maxHeight: maxImageHeight, maxBytes: maxImageBytes,
          }));
        }
        urls.push(uploadedRef.current[p.uri]);
      }

      const fields = {
        category_id: categoryId,
        brand_id: brandId || null,
        title: title.trim(),
        description: description.trim(),
        price_minor: Math.round(Number(price) * 100),
        condition,
        color,
        size_system: sizeSystem,
        size_value: rule.input_type === 'none'
          ? null
          : rule.input_type === 'waist_inseam' ? `${Number(waist)}x${Number(inseam)}` : sizeValue,
      };
      if (editing) {
        setProgress('Сохранение…');
        await updateProduct(editId, fields);
        for (const imageId of removedImageIds) {
          await deleteProductImage(editId, imageId);
        }
        for (let i = 0; i < photos.length; i += 1) {
          if (!photos[i].imageId) await addProductImage(editId, { url: urls[i], position: i });
        }
        setRemovedImageIds([]);
      } else {
        setProgress('Публикация…');
        await createProduct({ ...fields, images: urls.map((url, position) => ({ url, position })) });
      }

      // Сервер принял объявление — подтягиваем «Мои объявления» и общую ленту.
      reloadAfterChange();
      leaveGuard.current.allowLeave = true;
      setShowSuccess(true);
    } catch (e) {
      setSubmitError(describeError(e, editing));
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  const refsReady = !configLoading && sizeSystems.length > 0 && !refsError;

  const categorySelect = categoryOptions.map((o) => ({ ...o, onSelect: () => setCategoryId(o.value) }));
  const brandSelect = brandOptions.map((o) => ({ ...o, onSelect: () => setBrandId(o.value) }));
  const colorLabel = colorChoices.find((c) => c.value === color)?.label;
  const emptySlots = Math.max(0, maxImages - photos.length - 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={editing ? 'Редактирование' : 'Новый товар'} onBack={() => navigation.goBack()} />

      <KeyboardAware dismissOnTap={false}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!refsReady && !configLoading && (
          <Pressable style={styles.notice} onPress={() => { reloadConfig(); loadRefs(); }}>
            <Text style={styles.noticeText}>
              Не удалось загрузить справочники (категории, размеры). Нажмите, чтобы повторить.
            </Text>
          </Pressable>
        )}

        <Label required>{`Фотографии · ${photos.length}/${maxImages}`}</Label>
        {/* «Добавить фото» — вне горизонтальной прокрутки: на Android 8 она
            считала себя «докручивающейся по инерции» и забирала первое
            касание, так что кнопка срабатывала только со второго тапа
            (ScrollView._isAnimating, Galaxy S9, 21.10). */}
        <View style={styles.photoStrip}>
          {photos.length < maxImages && (
            <Pressable style={[styles.photoBox, styles.photoAdd]} accessibilityLabel="Добавить фото" onPress={() => setPhotoSheet(true)}>
              <CameraIcon size={24} color={colors.accent} />
            </Pressable>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow} style={styles.photoScroll}>
            {photos.map((p, i) => (
              <View key={p.uri} style={styles.photoBox}>
                <Image source={{ uri: p.uri }} style={styles.photoImage} resizeMode="cover" />
                {i === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>ГЛАВНОЕ</Text>
                  </View>
                )}
                <Pressable style={styles.removeBtn} hitSlop={8} accessibilityLabel="Удалить фото" onPress={() => removePhoto(p)}>
                  <CloseIcon size={11} color={colors.text} />
                </Pressable>
              </View>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.photoBox, styles.photoEmpty]}>
                <CameraIcon size={22} color="#3a3a3a" />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.gap} />
        <SelectField
          label="Категория"
          required
          value={categoryId}
          placeholder="Выберите категорию"
          options={categorySelect}
          emptyText="Категории не загружены"
        />

        <View style={styles.gap} />
        <SelectField
          label="Бренд"
          value={brandId}
          placeholder="Выберите бренд"
          options={brandSelect}
          searchable={brandSelect.length > 8}
        />

        <View style={styles.gap} />
        <Label required>Модель</Label>
        <TextInput
          style={styles.textInput}
          placeholder="Например, Air Max 90"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.gap} />
        <Label required>Размер</Label>
        {!categoryId ? (
          <Text style={styles.hint}>Сначала выберите категорию</Text>
        ) : (
          <>
            <View style={styles.choiceRow}>
              {systemChoices.map((c) => (
                <ChoiceChip key={c.value} label={c.label} active={sizeSystem === c.value} onPress={() => onSelectSystem(c.value)} />
              ))}
            </View>
            {(rule?.input_type === 'select' || rule?.input_type === 'numeric') && (
              <View style={[styles.choiceRow, { marginTop: 10 }]}>
                {sizeChoices.map((c) => (
                  <ChoiceChip key={c.value} label={c.label} active={sizeValue === c.value} onPress={() => setSizeValue(c.value)} />
                ))}
              </View>
            )}
            {rule?.input_type === 'waist_inseam' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.hint}>Обхват талии × длина по внутреннему шву</Text>
                <View style={styles.waistRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder={`${rule.min_waist}–${rule.max_waist}`}
                    placeholderTextColor={colors.textFaint}
                    keyboardType="number-pad"
                    value={waist}
                    onChangeText={(t) => setWaist(t.replace(/\D/g, ''))}
                  />
                  <Text style={styles.waistX}>×</Text>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder={`${rule.min_inseam}–${rule.max_inseam}`}
                    placeholderTextColor={colors.textFaint}
                    keyboardType="number-pad"
                    value={inseam}
                    onChangeText={(t) => setInseam(t.replace(/\D/g, ''))}
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.gap} />
        <Text style={styles.label}>
          Цвет<Text style={styles.required}> *</Text>
          {!!colorLabel && <Text style={styles.colorName}> · {colorLabel}</Text>}
        </Text>
        <View style={styles.swatches}>
          {colorChoices.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.swatch, color === c.value && styles.swatchActive]}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              accessibilityState={{ selected: color === c.value }}
              onPress={() => setColor(c.value)}
            >
              <Swatch value={c.value} />
            </Pressable>
          ))}
        </View>

        <View style={styles.gap} />
        <Label required>{currencySign ? `Цена, ${currencySign}` : 'Цена'}</Label>
        <View style={styles.field}>
          <TextInput
            style={[styles.fieldInput, { fontWeight: '700' }]}
            placeholder="8900"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            keyboardType="number-pad"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
          />
          {!!currencySign && <Text style={styles.currency}>{currencySign}</Text>}
        </View>

        <View style={styles.gap} />
        <Label required>Состояние</Label>
        <View style={styles.condGrid}>
          {conditions.map((c) => (
            <ChoiceChip key={c.value} wide label={c.label} active={condition === c.value} onPress={() => setCondition(c.value)} />
          ))}
        </View>

        <View style={styles.gap} />
        <Label required>Описание</Label>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Расскажите о состоянии, истории покупки, дефектах — это повышает доверие покупателей"
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          multiline
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChangeText={setDescription}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />
        <View style={styles.counterRow}>
          <Text style={styles.hint}>Покажется в карточке товара</Text>
          <Text style={styles.hint}>{description.length} / {MAX_DESCRIPTION}</Text>
        </View>

        {submitError && <Text style={styles.error}>{submitError}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={submitting ? (progress || (editing ? 'Сохранение…' : 'Публикация…')) : (editing ? 'Сохранить' : 'Опубликовать')}
          disabled={!canPublish || !refsReady}
          onPress={publish}
        />
      </View>
      </KeyboardAware>

      <BottomSheet visible={photoSheet} onClose={() => setPhotoSheet(false)}>
        <Pressable style={styles.sheetRow} onPress={() => addPhotos('camera')}>
          <View style={styles.sheetIconRow}><CameraIcon size={20} color={colors.accent} /><Text style={styles.sheetText}>Камера</Text></View>
        </Pressable>
        <Pressable style={[styles.sheetRow, { borderBottomWidth: 0 }]} onPress={() => addPhotos('library')}>
          <View style={styles.sheetIconRow}><ImageIcon size={20} color={colors.accent} /><Text style={styles.sheetText}>Галерея</Text></View>
        </Pressable>
      </BottomSheet>

      <SuccessOverlay
        visible={showSuccess}
        title={editing ? 'Изменения сохранены' : 'Товар опубликован'}
        message={editing ? 'Покупатели увидят обновлённое объявление.' : 'Ваше объявление сохранено и уже доступно покупателям в ленте ARVELL'}
        buttonText="Отлично"
        onClose={() => { setShowSuccess(false); navigation.goBack(); }}
      />

      <ConfirmDialog
        visible={!!pendingLeave}
        title={editing ? 'Выйти без сохранения?' : 'Выйти без сохранения?'}
        message={editing ? 'Изменения в объявлении не сохранятся.' : 'Объявление ещё не опубликовано — всё, что вы заполнили, пропадёт.'}
        confirmText="Выйти"
        cancelText="Остаться"
        onConfirm={() => {
          const action = pendingLeave;
          setPendingLeave(null);
          leaveGuard.current.allowLeave = true;
          navigation.dispatch(action);
        }}
        onCancel={() => setPendingLeave(null)}
        onDismiss={() => setPendingLeave(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.md, paddingTop: 22, paddingBottom: spacing.xl },
  gap: { height: 22 },
  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },
  required: { color: colors.accent },
  colorName: { color: colors.text, textTransform: 'none', letterSpacing: 0, fontFamily: undefined },
  hint: { color: colors.textMuted, fontSize: 12.5 },

  notice: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger, padding: spacing.md, marginBottom: spacing.lg },
  noticeText: { color: colors.danger, fontSize: font.sizeSM },
  error: { color: colors.danger, fontSize: font.sizeSM, marginTop: spacing.lg },

  photoStrip: { flexDirection: 'row', gap: spacing.sm },
  photoScroll: { flex: 1 },
  photoRow: { gap: spacing.sm },
  photoBox: {
    width: 88, height: 88, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#555' },
  photoEmpty: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#2e2e2e' },
  photoImage: { width: '100%', height: '100%' },
  mainBadge: { position: 'absolute', left: 4, bottom: 4, backgroundColor: colors.accent, paddingHorizontal: 5, paddingVertical: 2 },
  mainBadgeText: { ...type.monoMedium, color: colors.accentText, fontSize: 8.5 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },

  field: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
  },
  fieldText: { flex: 1, color: colors.text, fontSize: 15 },
  fieldTextFaint: { color: colors.textMuted },
  fieldInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  currency: { color: colors.textMuted, fontSize: 15 },
  textInput: {
    minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    color: colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top', lineHeight: 21 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

  sheetList: { maxHeight: 360 },
  sheetEmpty: { color: colors.textMuted, fontSize: 14, paddingVertical: spacing.md },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetText: { color: colors.text, fontSize: 15 },

  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: {
    minWidth: 48, height: 38, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  choiceWide: { flexBasis: '48%', flexGrow: 1, height: 42 },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  choiceTextActive: { color: colors.accentText },
  condGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderColor: colors.accent },

  waistRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  waistX: { color: colors.textMuted, fontSize: font.sizeLG },

  footer: { paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});

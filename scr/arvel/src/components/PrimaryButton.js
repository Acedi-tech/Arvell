// Старое имя главной кнопки — теперь это Button в варианте primary.
import React from 'react';
import Button from './Button';

export default function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

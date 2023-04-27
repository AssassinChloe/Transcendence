import '../styles/ContextMenu.css'
import * as React from 'react';
import { useContextMenu } from '../hooks/useContextMenu.ts';

type Props = {
  items: Array<string>;
};

const ContextMenu = ({ items }: Props) => {
  const { anchorPoint, isShown } = useContextMenu();

  if (!isShown) {
    return null;
  }

  return (
    <ul
      className='ContextMenu'
      style={{ top: anchorPoint.y, left: anchorPoint.x }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export { ContextMenu };
import { createSignal, createEffect, onCleanup, on, JSXElement, For } from 'solid-js';
import styles from './index.module.css'

interface VirtualListProps<D> {
  list: D[],
  keeps: number,
  itemHeight: number,
  children: (childProps: { index: number, item: D }) => JSXElement,
}

function VirtualList<D extends any>(props: VirtualListProps<D>) {
  const [listWrapper, setListWrapper] = createSignal<HTMLDivElement | null>(null);
  const [startOffset, setStartOffset] = createSignal(0);

  const totalHeight = () => props.list.length * props.itemHeight
  const start = () => Math.floor(startOffset() / props.itemHeight)
  const visibleList = () => {
    return [1,2,3,4]
    // return props.list.slice(start(), start() + props.keeps)
  }

  createEffect(on(() => props.list, () => {
    setStartOffset(0);
  }))

  const scrollHandler = () => {
    const prevCount = 10;
    const scrollTop = listWrapper()?.scrollTop ?? 0;

    let newStartOffset = Math.max(scrollTop - props.itemHeight * prevCount, 0);
    newStartOffset = Math.min(Math.max(0, totalHeight() - props.itemHeight * props.keeps), newStartOffset);

    setStartOffset(newStartOffset);
  };

  createEffect(() => {
    const wrapper = listWrapper();
    if (wrapper) {
      wrapper.addEventListener('scroll', scrollHandler);
      onCleanup(() => {
        wrapper.removeEventListener('scroll', scrollHandler);
      });
    }
  });

  return (
    <div class={'virtual-list ' + styles.virtualList} ref={setListWrapper}>
      <div
        class={'virtual-list__inner ' + styles.virtualListInner}
        style={{
          'padding-top': `${startOffset()}px`,
          'min-height': `${totalHeight()}px`,
        }}
      >
        <For each={visibleList()}>
          {(item, index) => {
            return (
              <div>{index()}</div>
            )
          }}
        </For>
      </div>
    </div>
  );
}

export default VirtualList;

<script lang="ts">
/**
 * CardGrid re-parents each meaningful slotted VNode into a generated grid item
 * so cards keep their identity and keys across re-renders.
 */
import {
  Comment,
  Fragment,
  Text,
  computed,
  defineComponent,
  h,
  useSlots,
  type VNode,
} from 'vue'

function flattenCardNodes(nodes: Array<VNode | null | undefined>): VNode[] {
  const result: VNode[] = []

  for (const node of nodes) {
    if (!node || node.type === Comment || node.type === Text) {
      continue
    }

    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenCardNodes(node.children as VNode[]))
      continue
    }

    result.push(node)
  }

  return result
}

export default defineComponent({
  name: 'CardGrid',
  props: {
    automationId: { type: String, default: undefined },
  },
  setup(props) {
    const slots = useSlots()
    const cardNodes = computed(() =>
      flattenCardNodes(slots.default ? slots.default() : []),
    )

    return () =>
      h(
        'div',
        {
          class: 'mh-card-grid',
          'data-automation-id': props.automationId,
        },
        cardNodes.value.map((node, index) =>
          h(
            'div',
            {
              key: node.key ?? index,
              class: 'mh-card-grid__item',
            },
            [node],
          ),
        ),
      )
  },
})
</script>

<style scoped>
.mh-card-grid {
  display: grid;
  width: 100%;
  gap: 16px;
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 600px) {
  .mh-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .mh-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .mh-card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1600px) {
  .mh-card-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (min-width: 1920px) {
  .mh-card-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 2240px) {
  .mh-card-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

@media (min-width: 2560px) {
  .mh-card-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

.mh-card-grid__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.mh-card-grid__item :deep(.mh-card:not(.mh-card--collapsed)) {
  align-self: stretch;
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
}

.mh-card-grid__item :deep(.mh-card--collapsed) {
  align-self: flex-start;
  width: 100%;
  height: auto;
  flex: 0 0 auto;
  min-height: 0;
}
</style>

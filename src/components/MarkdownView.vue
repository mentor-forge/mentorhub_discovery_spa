<template>
  <div class="markdown-view" v-html="sanitizedHtml"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { computed } from 'vue'

interface Props {
  source?: string
}

const props = withDefaults(defineProps<Props>(), {
  source: '',
})

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(marked.parse(props.source, { async: false }), {
    ALLOWED_TAGS: [
      'a',
      'blockquote',
      'br',
      'code',
      'del',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'li',
      'ol',
      'p',
      'pre',
      'strong',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  }),
)
</script>

<style scoped>
.markdown-view :deep(:first-child) {
  margin-top: 0;
}

.markdown-view :deep(:last-child) {
  margin-bottom: 0;
}
</style>

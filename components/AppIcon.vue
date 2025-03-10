<template>
  <Icon
    :icon="icon"
    :class="className"
    :width="width"
    :height="height"
    :flip="flip"
    :color="color"
  />
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps({
  icon: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    default: "",
  },
  width: {
    type: [ String, Number ],
    default: "1em",
  },
  height: {
    type: [ String, Number ],
    default: "1em",
  },
  flip: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "",
  },
});
</script>

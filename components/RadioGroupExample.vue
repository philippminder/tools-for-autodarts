<template>
  <div class="space-y-8 p-4">
    <h2 class="text-xl font-bold">
      Radio Group Examples
    </h2>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        Basic Radio Group
      </h3>
      <AppRadioGroup
        v-model="selectedOption"
        :options="options"
      />
      <p class="text-white/70">
        Selected value: {{ selectedOption }}
      </p>
    </div>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        Radio Group with Labels
      </h3>
      <AppRadioGroup
        v-model="selectedOptionWithLabel"
        :options="optionsWithLabels"
      />
      <p class="text-white/70">
        Selected value: {{ selectedOptionWithLabel }}
      </p>
    </div>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        Vertical Layout
      </h3>
      <AppRadioGroup
        v-model="selectedVertical"
        :options="optionsWithLabels"
        vertical
      />
      <p class="text-white/70">
        Selected value: {{ selectedVertical }}
      </p>
    </div>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        Different Button Sizes
      </h3>
      <div class="space-y-4">
        <div>
          <p class="mb-2 text-white/70">
            Small
          </p>
          <AppRadioGroup
            v-model="selectedSizeSm"
            :options="sizeOptions"
            button-size="sm"
          />
        </div>
        <div>
          <p class="mb-2 text-white/70">
            Medium (default)
          </p>
          <AppRadioGroup
            v-model="selectedSizeMd"
            :options="sizeOptions"
            button-size="md"
          />
        </div>
        <div>
          <p class="mb-2 text-white/70">
            Large
          </p>
          <AppRadioGroup
            v-model="selectedSizeLg"
            :options="sizeOptions"
            button-size="lg"
          />
        </div>
      </div>
    </div>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        With Disabled Options
      </h3>
      <AppRadioGroup
        v-model="selectedWithDisabled"
        :options="optionsWithDisabled"
      />
      <p class="text-white/70">
        Selected value: {{ selectedWithDisabled }}
      </p>
    </div>

    <div class="space-y-4 rounded border border-white/10 p-4">
      <h3 class="text-lg font-semibold">
        Custom Class
      </h3>
      <AppRadioGroup
        v-model="selectedCustomClass"
        :options="optionsWithLabels"
        class-name="justify-center"
      />
      <p class="text-white/70">
        Selected value: {{ selectedCustomClass }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppRadioGroup from "@/components/AppRadioGroup.vue";

// Basic options (without labels)
const options = [
  { value: "option1" },
  { value: "option2" },
  { value: "option3" },
];

// Options with labels
const optionsWithLabels = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];

// Options for size examples
const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

// Options with disabled items
const optionsWithDisabled = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2 (Disabled)", value: "option2", disabled: true },
  { label: "Option 3", value: "option3" },
  { label: "Option 4 (Disabled)", value: "option4", disabled: true },
];

// State for each example
const selectedOption = ref("option1");
const selectedOptionWithLabel = ref("option2");
const selectedVertical = ref("option3");
const selectedSizeSm = ref("small");
const selectedSizeMd = ref("medium");
const selectedSizeLg = ref("large");
const selectedWithDisabled = ref("option3");
const selectedCustomClass = ref("option1");
</script>

<template>
  <div class="ne-selector">
    <a-row :gutter="12">
      <a-col :span="6" v-if="showProvince">
        <a-form-item label="省份">
          <a-select v-model:value="form.province_code" placeholder="请选择" allowClear @change="onProvinceChange">
            <a-select-option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="6">
        <a-form-item label="专业">
          <a-select v-model:value="form.major" placeholder="请选择" allowClear @change="onMajorChange">
            <a-select-option v-for="m in majors" :key="m.code" :value="m.code">{{ m.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="6">
        <a-form-item label="类型">
          <a-select v-model:value="form.ne_type" placeholder="请选择" allowClear @change="onTypeChange">
            <a-select-option v-for="t in neTypes" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="6">
        <a-form-item label="厂商">
          <a-select v-model:value="form.vendor" placeholder="请选择" allowClear>
            <a-select-option v-for="v in vendors" :key="v.code" :value="v.code">{{ v.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
    <a-row :gutter="12" v-if="showNeSearch">
      <a-col :span="12">
        <a-form-item label="网元">
          <a-select
            v-model:value="form.ne_ids"
            mode="multiple"
            placeholder="搜索网元名称/ID..."
            :filterOption="false"
            :maxCount="10"
            @search="onNeSearch"
          >
            <a-select-option v-for="ne in neOptions" :key="ne.ne_id" :value="ne.ne_id">
              {{ ne.ne_name }} ({{ ne.ne_id }})
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { getFilterOptions, searchNe } from '@/api/common';
import { useUserStore } from '@/stores/user';

const props = withDefaults(defineProps<{
  showNeSearch?: boolean;
  modelValue?: Record<string, any>;
}>(), {
  showNeSearch: true,
});

const emit = defineEmits(['update:modelValue', 'change']);
const userStore = useUserStore();

const form = reactive({
  province_code: '',
  major: '',
  ne_type: '',
  vendor: '',
  ne_ids: [] as string[],
});

const provinces = ref<any[]>([]);
const majors = ref<any[]>([]);
const neTypes = ref<any[]>([]);
const vendors = ref<any[]>([]);
const neOptions = ref<any[]>([]);

const showProvince = computed(() => userStore.isGroupAdmin());

onMounted(() => {
  loadFilterOptions();
});

async function loadFilterOptions() {
  try {
    const res: any = await getFilterOptions({
      province_code: form.province_code,
      major: form.major,
      ne_type: form.ne_type,
    });
    provinces.value = res.provinces || [];
    majors.value = res.majors || [];
    neTypes.value = res.ne_types || [];
    vendors.value = res.vendors || [];
  } catch {}
}

function onProvinceChange() { loadFilterOptions(); emitChange(); }
function onMajorChange() { loadFilterOptions(); emitChange(); }
function onTypeChange() { loadFilterOptions(); emitChange(); }

async function onNeSearch(keyword: string) {
  if (!keyword) return;
  try {
    const res: any = await searchNe({
      keyword,
      province_code: form.province_code,
      ne_type: form.ne_type,
    });
    neOptions.value = res || [];
  } catch {}
}

function emitChange() {
  const val = { ...form };
  emit('update:modelValue', val);
  emit('change', val);
}

function getValues() {
  return { ...form };
}

defineExpose({ getValues });
</script>

<style lang="less" scoped>
.ne-selector {
  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
  :deep(.ant-form-item-label) {
    padding-bottom: 2px;
  }
}
</style>

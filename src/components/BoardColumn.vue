<template>
  <AppDrop @drop="moveTaskOrColumn">
    <AppDrag
      class="column"
      :transferData="{ type: 'column', fromColumnIndex: columnIndex }"
    >
      <div class="flex items-center mb-2 font-bold">
        {{ column.doc.name }}
      </div>
      <div class="list-reset">
        <ColumnTask
          v-for="(task, $taskIndex) of filteredTaskByColumnId()"
          :key="$taskIndex"
          :task="task"
          :tasks="tasks"
          :taskIndex="$taskIndex"
          :column="column"
          :columnIndex="columnIndex"
          :columns="columns"
        />
        <input
          type="text"
          class="block p-2 w-full bg-transparent"
          placeholder="+ Enter new task"
          @keyup.enter="createTask($event, column.doc._id)"
        />
      </div>
    </AppDrag>
  </AppDrop>
</template>

<script>
import ColumnTask from './ColumnTask'
import AppDrag from './AppDrag'
import AppDrop from './AppDrop'
import movingTasksAndColumnsMixin from '@/mixins/movingTasksAndColumnsMixin'
import { mapActions } from 'vuex'
export default {
  components: { ColumnTask, AppDrag, AppDrop },
  mixins: [movingTasksAndColumnsMixin],
  props: {
    column: {
      type: Object,
      required: true
    },
    columnIndex: {
      type: Number,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    tasks: {
      type: Array,
      required: true
    }
  },
  methods: {
    ...mapActions(['addTask']),
    createTask (e, columnId) {
      this.addTask({ name: e.target.value, columnId })
      // clear input
      e.target.value = ''
    },
    filteredTaskByColumnId () {
      return this.tasks.filter(task => {
        return task.doc.columnId === this.column.doc._id
      })
    }
  }
}
</script>

<style lang="css">
.column {
  @apply bg-grey-light p-2 mr-4 text-left shadow rounded;
  min-width: 350px;
}
</style>

<template>
  <div
    class="task"
    @click="goToTask(task)"
    draggable
    @dragstart="pickupTask($event, taskIndex, columnIndex)"
    @dragover.prevent
    @dragenter.prevent
    @drop.stop="moveTaskOrColumn($event, column.tasks, columnIndex, taskIndex)"
  >
    <span class="w-full flex-no-shrink font-bold">
      {{ task.name }}
    </span>
    <p v-if="task.description" class="w-full flex-no-shrink mt-1 text-small">
      {{ task.description }}
    </p>
  </div>
</template>

<script>
import movingTasksAndColumnsMixin from '@/mixins/movingTasksAndColumnsMixin'
export default {
  mixins: [ movingTasksAndColumnsMixin ],
  props: {
    task: {
      type: Object,
      required: true
    },
    taskIndex: {
      type: Number,
      required: true
    }
  },
  methods: {
    goToTask (task) {
      this.$router.push({ name: 'task', params: { id: task.id } })
    },
    pickupTask (e, fromTaskIndex, fromColumnIndex) {
      // dataTransfer interface works pretty similar to localStorage in that it can only store properties that can be /stringified/
      // This means transferring recursive data structures or functions won’t work.
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'

      e.dataTransfer.setData('from-task-index', fromTaskIndex)
      e.dataTransfer.setData('from-column-index', fromColumnIndex)
      e.dataTransfer.setData('type', 'task')
    }
  }
}
</script>

<style lang="css">
.task {
  @apply flex items-center flex-wrap shadow mb-2 py-2 px-2 rounded bg-white text-grey-darkest no-underline;
}
</style>

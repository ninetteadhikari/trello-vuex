<template>
<div>
    <div v-if="taskHasConflict" class="text-white px-6 py-4 border-0 rounded relative mb-4 bg-orange-dark">
    <span class="text-xl inline-block mr-2 mt-1 align-middle">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5">
      <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd" />
    </svg>
    </span>
    <span class="inline-block align-middle mr-8">
      <b class="capitalize">Conflict:</b> This task has been updated while you were offline. Please save your data separately and refresh the page to view new data.
    </span>
  </div>
  <div class="task-view">
    <div class="flex flex-col flex-grow items-start justify-between px-4">
      <input
        class="p-2 w-full mr-2 block text-xl font-bold"
        :value="task[0].name"
        @key.enter="updateTaskProperty($event, 'name', task[0]._id)"
        @change="updateTaskProperty($event, 'name', task[0]._id)"
      />
      <textarea
        placeholder="Enter task description"
        class="relative w-full bg-transparent px-2 border mt-2 h-64 border-none leading-normal"
        :value="task[0].description"
        @change="updateTaskProperty($event, 'description', task[0]._id)"
      />
    </div>
  </div>
</div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  computed: {
    ...mapState(['tasks', 'taskHasConflict']),
    task () {
      const testing = this.tasks.filter(task => {
        return task._id === this.$route.params.id
      })
      return testing
    }
  },
  methods: {
    ...mapActions(['editTask']),
    updateTaskProperty (e, key, taskId) {
      this.editTask({ taskId, key, value: e.target.value })
    }
  }
}
</script>

<style>
.task-view {
  @apply relative flex flex-row bg-white pin mx-4 m-32 mx-auto py-4 text-left rounded shadow;
  max-width: 700px;
}
</style>

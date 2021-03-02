<template>
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
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  computed: {
    ...mapState(['tasks']),
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

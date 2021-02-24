<template>
  <div class="board">
    <div class="flex flex-row items-start">
      <BoardColumn
        v-for="(column, $columnIndex) of columns"
        :key="$columnIndex"
        :column="column"
        :columnIndex="$columnIndex"
        :columns="columns"
        :tasks="tasks"
      />
      <div class="column flex">
        <input
          type="text"
          class="p-2 mr-2 flex-grow"
          placeholder="+ New list name"
          v-model="newColumnName"
          @keyup.enter="createColumn"
        />
      </div>
    </div>
    <div class="task-bg" v-if="isTaskOpen" @click.self="close">
      <router-view/>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import BoardColumn from '../components/BoardColumn'

export default {
  components: { BoardColumn },
  data () {
    return {
      newColumnName: ''
    }
  },
  computed: {
    ...mapState(['columns', 'tasks']),
    isTaskOpen () {
      return this.$route.name === 'task'
    }
  },
  methods: {
    ...mapActions(['addColumn', 'fetchAllData']),
    close () {
      this.$router.push({ name: 'board' })
    },
    createColumn () {
      this.addColumn(this.newColumnName)
      this.newColumnName = ''
    }
  },
  created () {
    this.fetchAllData()
  }
}
</script>

<style lang="css">
.board {
  @apply p-4 bg-indigo-light h-full overflow-auto;
}

.task-bg {
  @apply pin absolute;
  background: rgba(0, 0, 0, 0.5);
}
</style>

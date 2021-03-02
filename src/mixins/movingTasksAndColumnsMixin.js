import { mapActions } from 'vuex'
export default {
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
    ...mapActions(['changeTaskColumn']),
    moveTaskOrColumn (transferData) {
      if (transferData.type === 'task') {
        this.moveTask(transferData)
      } else {
        this.moveColumn(transferData)
      }
    },
    moveTask ({ fromColumnIndex, fromTaskIndex }) {
      const fromTasks = this.tasks.filter(
        task => task.doc.columnId === this.columns[fromColumnIndex].doc._id
      )
      const fromTaskId = fromTasks[fromTaskIndex].doc._id

      this.changeTaskColumn({
        fromTasks,
        fromTaskIndex,
        toTaskIndex: this.taskIndex,
        fromTaskId,
        toTaskColumnId: this.column.doc._id
      })
    },
    moveColumn ({ fromColumnIndex }) {
      this.$store.commit('MOVE_COLUMN', {
        fromColumnIndex,
        toColumnIndex: this.columnIndex
      })
    }
  }
}

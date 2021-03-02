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
    ...mapActions(['changeTaskColumn', 'changeColumnPosition']),
    moveTaskOrColumn (transferData) {
      if (transferData.type === 'task') {
        this.moveTask(transferData)
      } else {
        this.moveColumn(transferData)
      }
    },
    moveTask ({ fromColumnIndex, fromTaskIndex }) {
      const fromTasks = this.tasks.filter(
        task => task.columnId === this.columns[fromColumnIndex]._id
      )
      const fromTaskId = fromTasks[fromTaskIndex]._id

      this.changeTaskColumn({
        fromTasks,
        fromTaskIndex,
        toTaskIndex: this.taskIndex,
        fromTaskId,
        toTaskColumnId: this.column._id
      })
    },
    moveColumn ({ fromColumnIndex, columnId }) {
      this.changeColumnPosition({
        columnId,
        fromColumnIndex,
        toColumnIndex: this.columnIndex
      })
    }
  }
}

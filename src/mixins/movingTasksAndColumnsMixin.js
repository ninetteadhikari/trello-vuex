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
    ...mapActions(['changeTaskPosition', 'changeColumnPosition']),
    moveTaskOrColumn (transferData) {
      if (transferData.type === 'task') {
        this.moveTask(transferData)
      } else {
        this.moveColumn(transferData)
      }
    },
    moveTask ({ fromTaskId }) {
      this.changeTaskPosition({
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

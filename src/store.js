import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

let board = new PouchDB('board')
var remoteCouch = process.env.VUE_APP_COUCHDB_URL

export default new Vuex.Store({
  state: {
    columns: [],
    tasks: [],
    taskHasConflict: false
  },
  actions: {
    async fetchAllData ({ commit }) {
      try {
        const doc = await board.allDocs({ include_docs: true })
        commit('SET_BOARD', doc.rows)
      } catch (error) {
        console.log(error)
      }
    },
    dbSync ({ dispatch }) {
      const opts = { live: true }
      board
        .sync(remoteCouch, opts)
        .on('change', () => {
          dispatch('fetchAllData')
        })
        .on('error', (error) => console.log(error))
    },
    async addColumn ({ state, commit }, name) {
      try {
        /* COLUMN POSITION
        A position attribute is added for each new column created.
        Each position is given a float number instead of an integer.
        This allows for ordering of the list without having to update the positions of the adjoining items.
        The float number for the position is calculated by incrementing the column array length by one and
        dividing by 10 yielding a series of float position like 0.1, 0.2, 0.3 etc.
        Reference: http://guide.couchdb.org/draft/recipes.html#ordering */

        const newPosition = (state.columns.length + 1) / 10
        const newColumn = {
          _id: uuidv4(),
          name,
          type: 'column',
          position: newPosition
        }
        const result = await board.put(newColumn)
        commit('CREATE_COLUMN', { result, name, newPosition })
      } catch (error) {
        console.log(error)
      }
    },
    async addTask ({ commit }, { name, columnId, filteredTasks }) {
      try {
        /* TASK POSITION
        The task position is calculated in the exact same way as the column
        position as explained in the `addColumn` action above.
        For tasks instead of taking the entire tasks array length, the length of the tasks filtered by the selected column is taken.
        This allows for the task to be sorted per column. */

        const newPosition = (filteredTasks.length + 1) / 10
        const newTask = {
          _id: uuidv4(),
          name,
          type: 'task',
          columnId,
          description: '',
          position: newPosition
        }
        const result = await board.put(newTask)
        commit('CREATE_TASK', { result, name, columnId, newPosition })
      } catch (error) {
        console.log(error)
      }
    },
    async editTask ({ state, commit }, { taskId, key, value }) {
      // TODO: need to revisit to ensure simultaneous editing is addressed (need to make use of 'rev'/ or use full task object)
      try {
        const doc = await board.get(taskId)
        // TODO: add logic if rev is different
        const editedTask = state.tasks.filter(task => task._id === taskId)
        const isTaskRevSame = editedTask[0]._rev === doc._rev

        if (isTaskRevSame) {
          doc[key] = value
          await board.put(doc)
          commit('UPDATE_TASK', { taskId, key, value })
        } else {
          commit('ALERT_TASK_CONFLICT')
        }
      } catch (error) {
        console.log(error)
      }
    },
    async changeColumnPosition (
      { state, commit },
      { columnId, fromColumnIndex, toColumnIndex }
    ) {
      try {
        let newPosition

        const toColumn = state.columns[toColumnIndex]
        const toColumnPosition = toColumn.position
        const columnLength = state.columns.length

        const isColumnIndexFirst = toColumnIndex === 0
        const isColumnIndexLast = toColumnIndex === columnLength - 1

        /* NEW POSITION
        The new position of the column that is moved, is the median of the position
        of the two surrounding columns. */

        if (isColumnIndexFirst) {
          // Scenario 1: When a column is moved to the first position
          newPosition = toColumnPosition / 2
        } else if (isColumnIndexLast) {
          // Scenario 2: When a column is moved to the last position
          const nextToLastColumnPosition = (columnLength + 1) / 10
          newPosition = (toColumnPosition + nextToLastColumnPosition) / 2
        } else if (fromColumnIndex < toColumnIndex) {
          // Scenario 3: When a column is moved from left to right
          const nextColumn = state.columns[toColumnIndex + 1]
          const nextColumnPosition = nextColumn.position
          newPosition = (nextColumnPosition + toColumnPosition) / 2
        } else if (fromColumnIndex > toColumnIndex) {
          // Scenario 4: When a column is moved from right to left
          const previousColumn = state.columns[toColumnIndex - 1]
          const previousColumnPosition = previousColumn.position
          newPosition = (previousColumnPosition + toColumnPosition) / 2
        }

        const doc = await board.get(columnId)
        doc.position = newPosition
        await board.put(doc)
        commit('MOVE_COLUMN', {
          fromColumnIndex,
          newPosition
        })
      } catch (error) {
        console.log(error)
      }
    },
    async changeTaskPosition (
      { state, commit },
      { fromTaskIndex, toTaskIndex, fromTaskId, toTaskColumnId }
    ) {
      try {
        let newPosition

        const toTasksList = state.tasks.filter(
          task => toTaskColumnId === task.columnId
        )
        const toTask = toTasksList[toTaskIndex]
        const toTaskPosition = toTask.position
        const taskLength = toTasksList.length

        const isColumnEmpty = taskLength === 0
        const isTaskIndexFirst = toTaskIndex === 0
        const isTaskIndexLast = toTaskIndex === taskLength - 1

        /* NEW POSITION
        The new position of the task that is moved, is the median of the position
        of the two surrounding tasks. */

        if (isColumnEmpty) {
          // Scenario 1: When a task is moved to an empty column
          newPosition = 0.1
        } else if (isTaskIndexFirst) {
          // Scenario 2: When a task is moved to the first position
          newPosition = toTaskPosition / 2
        } else if (isTaskIndexLast) {
          // Scenario 3: When a task is moved to the last position
          const nextToLastTaskPosition = (taskLength + 1) / 10
          newPosition = (toTaskPosition + nextToLastTaskPosition) / 2
        } else if (fromTaskIndex < toTaskIndex) {
          // Scenario 4: When a task is moved from top to bottom
          const nextTask = toTasksList[toTaskIndex + 1]
          const nextTaskPosition = nextTask.position
          newPosition = (nextTaskPosition + toTaskPosition) / 2
        } else if (fromTaskIndex > toTaskIndex) {
          // Scenario 5: When a task is moved from bottom to top
          const previousTask = toTasksList[toTaskIndex - 1]
          const previousTaskPosition = previousTask.position
          newPosition = (previousTaskPosition + toTaskPosition) / 2
        }

        const doc = await board.get(fromTaskId)
        doc.columnId = toTaskColumnId
        doc.position = newPosition
        await board.put(doc)
        commit('MOVE_TASK', {
          toTaskColumnId,
          fromTaskId,
          newPosition
        })
      } catch (error) {
        console.log(error)
      }
    }
  },
  mutations: {
    SET_BOARD (state, data) {
      // TODO: separate the code by column and task
      data.map(item => {
        switch (item.doc.type) {
          // Set column state
          case 'column':
            const columnIndex = state.columns.findIndex(
              column => column._id === item.doc._id
            )
            if (columnIndex === -1) {
              // Add new column if column doesn't exist
              state.columns.push(item.doc)
            } else {
              // Replace existing column
              state.columns[columnIndex] = item.doc
            }
            state.columns.sort((a, b) => a.position - b.position)
            break

          // Set task state
          case 'task':
            const taskIndex = state.tasks.findIndex(
              task => task._id === item.doc._id
            )
            if (taskIndex === -1) {
              // Add new task
              state.tasks.push(item.doc)
            } else {
              // Replace existing task
              state.tasks[taskIndex] = item.doc
            }
            state.tasks.sort((a, b) => a.position - b.position)
            break
        }
      })
    },
    CREATE_COLUMN (state, { result, name, newPosition }) {
      state.columns.push({
        name,
        type: 'column',
        position: newPosition,
        _id: result.id,
        _rev: result.rev
      })
    },
    CREATE_TASK (state, { result, name, columnId, newPosition }) {
      state.tasks.push({
        name,
        type: 'task',
        columnId,
        description: '',
        position: newPosition,
        _id: result.id,
        _rev: result.rev
      })
    },
    UPDATE_TASK (state, { taskId, key, value }) {
      const taskIndex = state.tasks.findIndex(task => {
        return task._id === taskId
      })
      state.tasks[taskIndex][key] = value
    },
    ALERT_TASK_CONFLICT (state) {
      state.taskHasConflict = true
    },
    MOVE_TASK (
      state,
      { toTaskColumnId, fromTaskId, newPosition }
    ) {
      state.tasks.map(task => {
        if (task._id === fromTaskId) {
          task.columnId = toTaskColumnId
          task.position = newPosition
        }
      })
    },
    MOVE_COLUMN (state, { fromColumnIndex, newPosition }) {
      state.columns[fromColumnIndex].position = newPosition
    }
  }
})

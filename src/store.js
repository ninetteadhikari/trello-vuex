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
    tasks: []
  },
  actions: {
    async fetchAllData ({ commit }) {
      await board
        .allDocs({ include_docs: true })
        .then(doc => {
          commit('SET_BOARD', doc.rows)
        })
        .catch(error => {
          console.log(error)
        })
    },
    async dbSync ({ dispatch }) {
      const opts = { live: true }
      await board
        .sync(remoteCouch, opts)
        .on('change', () => {
          dispatch('fetchAllData')
        })
        .catch(err => console.log(err))
    },
    async addColumn ({ state, commit }, name) {
      const newPosition = (state.columns.length + 1) / 10
      const newColumn = {
        _id: uuidv4(),
        name,
        type: 'column',
        position: newPosition
      }
      await board
        .put(newColumn)
        .then(result => {
          commit('CREATE_COLUMN', { result, name, newPosition })
        })
        .catch(error => {
          console.log(error)
        })
    },
    async addTask ({ commit }, { name, columnId, filteredTasks }) {
      const newPosition = (filteredTasks.length + 1) / 10
      const newTask = {
        _id: uuidv4(),
        name,
        type: 'task',
        columnId,
        description: '',
        position: newPosition
      }
      await board
        .put(newTask)
        .then(result => {
          commit('CREATE_TASK', { result, name, columnId, newPosition })
        })
        .catch(error => {
          console.log(error)
        })
    },
    async editTask ({ commit }, { taskId, key, value }) {
      await board
        .get(taskId)
        .then(doc => {
          doc[key] = value
          return board.put(doc)
        })
        .then(response => {
          commit('UPDATE_TASK', { taskId, key, value })
        })
        .catch(error => {
          console.log(error)
        })
    },
    async changeColumnPosition (
      { state, commit },
      { columnId, fromColumnIndex, toColumnIndex }
    ) {
      let newPosition
      if (toColumnIndex === 0) {
        newPosition = state.columns[toColumnIndex].position / 2
      } else if (toColumnIndex === state.columns.length - 1) {
        newPosition =
          (state.columns[toColumnIndex].position + (state.columns.length + 1) / 10) / 2
      } else if (fromColumnIndex < toColumnIndex) {
        newPosition =
        (state.columns[toColumnIndex + 1].position + state.columns[toColumnIndex].position) /
          2
      } else if (fromColumnIndex > toColumnIndex) {
        newPosition =
        (state.columns[toColumnIndex - 1].position + state.columns[toColumnIndex].position) /
        2
      }

      await board
        .get(columnId)
        .then(doc => {
          doc.position = newPosition
          return board.put(doc)
        })
        .then(response => {
          commit('MOVE_COLUMN', {
            fromColumnIndex,
            newPosition
        })
        })
        .catch(error => console.log(error))
    },
    async changeTaskPosition (
      { state, commit },
      { fromTaskIndex, toTaskIndex, fromTaskId, toTaskColumnId }
    ) {
      const toTasks = state.tasks.filter(
        task => toTaskColumnId === task.columnId
      )

      let newPosition
      if (toTasks.length === 0) {
        newPosition = 0.1
      } else if (toTaskIndex === 0) {
        newPosition = toTasks[toTaskIndex].position / 2
      } else if (toTaskIndex === toTasks.length - 1) {
        newPosition =
          (toTasks[toTaskIndex].position + (toTasks.length + 1) / 10) / 2
      } else if (fromTaskIndex < toTaskIndex) {
        newPosition =
        (toTasks[toTaskIndex + 1].position + toTasks[toTaskIndex].position) /
          2
      } else if (fromTaskIndex > toTaskIndex) {
        newPosition =
        (toTasks[toTaskIndex - 1].position + toTasks[toTaskIndex].position) /
        2
      }

      await board
        .get(fromTaskId)
        .then(doc => {
          doc.columnId = toTaskColumnId
          doc.position = newPosition
          return board.put(doc)
        })
        .then(response => {
          commit('MOVE_TASK', {
            toTaskColumnId,
            fromTaskId,
            newPosition
          })
        })
        .catch(error => {
          console.log(error)
        })
    }
  },
  mutations: {
    SET_BOARD (state, data) {
      data.map(item => {
        const columnIndex = state.columns.findIndex(
          column => column._id === item.doc._id
        )
        const taskIndex = state.tasks.findIndex(
          task => task._id === item.doc._id
        )

        if (columnIndex === -1 && taskIndex === -1) {
          item.doc.type === 'column'
            ? state.columns.push(item.doc)
            : state.tasks.push(item.doc)
        } else {
          item.doc.type === 'column'
            ? state.columns[columnIndex] = item.doc
            : state.tasks[taskIndex] = item.doc
        }
      })
      state.columns.sort((a, b) => a.position - b.position)
      state.tasks.sort((a, b) => a.position - b.position)
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

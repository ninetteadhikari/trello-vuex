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
      await board.allDocs({ include_docs: true }).then(doc => {
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
    async addColumn ({ commit }, name) {
      const newColumn = {
        _id: uuidv4(),
        name,
        type: 'column'
      }
      await board
        .put(newColumn)
        .then(result => {
          commit('CREATE_COLUMN', { result, name })
        })
        .catch(error => {
          console.log(error)
        })
    },
    async addTask ({ commit }, { name, columnId }) {
      const newTask = {
        _id: uuidv4(),
        name,
        type: 'task',
        columnId,
        description: ''
      }
      await board
        .put(newTask)
        .then(result => {
          commit('CREATE_TASK', { result, name, columnId })
        })
        .catch(error => {
          console.log(error)
        })
    },
    async editTask ({ commit }, { taskId, key, value }) {
      await board.get(taskId).then(doc => {
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
    async changeTaskColumn (
      { commit },
      {
        fromTasks,
        fromTaskIndex,
        toTasks,
        toTaskIndex,
        fromTaskId,
        toTaskColumnId
      }
    ) {
      await board
        .get(fromTaskId)
        .then(doc => {
          doc.columnId = toTaskColumnId
          return board.put(doc)
        })
        .then(response => {
          commit('MOVE_TASK', {
            fromTasks,
            fromTaskIndex,
            toTasks,
            toTaskIndex,
            toTaskColumnId
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
          return item.doc.type === 'column'
            ? state.columns.push(item.doc)
            : state.tasks.push(item.doc)
        }
      })
    },
    CREATE_COLUMN (state, { result, name }) {
      state.columns.push({
        name,
        type: 'column',
        _id: result.id,
        _rev: result.rev
      })
    },
    CREATE_TASK (state, { result, name, columnId }) {
      state.tasks.push({
        name,
        type: 'task',
        columnId,
        description: '',
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
      { fromTasks, fromTaskIndex, toTaskIndex, toTaskColumnId }
    ) {
      
      const taskToMove = fromTasks.splice(fromTaskIndex, 1)[0]
      taskToMove.columnId = toTaskColumnId

      const toTasks = state.tasks.filter(
        task => toTaskColumnId === task.columnId
      )

      toTasks.splice(toTaskIndex, 0, taskToMove)
    },
    MOVE_COLUMN (state, { fromColumnIndex, toColumnIndex }) {
      const columnList = state.columns
      const columnToMove = columnList.splice(fromColumnIndex, 1)[0]
      columnList.splice(toColumnIndex, 0, columnToMove)
    }
  }
})

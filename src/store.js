import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
// import defaultBoard from './default-board'
import { saveStatePlugin } from './utils'

Vue.use(Vuex)

// const board = JSON.parse(localStorage.getItem('board')) || defaultBoard

let board = new PouchDB('board')
var remoteCouch = process.env.VUE_APP_COUCHDB_URL

board.info((err, info) => {
  board.changes({
    since: info.update_seq,
    live: true
  }).on('change', this.fetchAllData)
  console.log(err)
})

export default new Vuex.Store({
  plugins: [saveStatePlugin],
  state: {
    columns: [],
    tasks: []
  },
  actions: {
    fetchAllData ({ commit }) {
      board.allDocs({ include_docs: true }).then(doc => {
        commit('SET_BOARD', doc.rows)
      }).catch(error => {
        console.log(error)
      })
    },
    dbSync () {
      const opts = { live: true }
      board.sync(remoteCouch, opts)
    },
    addColumn ({ commit }, name) {
      const newColumn = {
        _id: new Date().toISOString(),
        name,
        type: 'column'
      }
      board.put(newColumn).then(result => {
        commit('CREATE_COLUMN', { result, name })
      }).catch(error => {
        console.log(error)
      })
    },
    addTask ({ commit }, { name, columnId }) {
      const newTask = {
        _id: new Date().toISOString(),
        name,
        type: 'task',
        columnId,
        description: ''
      }
      board.put(newTask).then(result => {
        commit('CREATE_TASK', { result, name, columnId })
      }).catch(error => {
        console.log(error)
      })
    },
    editTask ({ commit }, { taskId, key, value }) {
      board.get(taskId).then(doc => {
        doc[key] = value
        return board.put(doc)
      }).then(response => {
        commit('UPDATE_TASK', { taskId, key, value })
      }).catch(error => {
        console.log(error)
      })
    },
    changeTaskColumn ({ commit }, { fromTasks, fromTaskIndex, toTasks, toTaskIndex, fromTaskId, toTaskColumnId }) {
      board.get(fromTaskId).then(doc => {
        doc.columnId = toTaskColumnId
        return board.put(doc)
      }).then(response => {
        commit('MOVE_TASK', { fromTasks, fromTaskIndex, toTasks, toTaskIndex, toTaskColumnId })
      }).catch(error => {
        console.log(error)
      })
    }
  },
  mutations: {
    SET_BOARD (state, data) {
      data.map(item => {
        item.doc.type === 'column' ? state.columns.push(item) : state.tasks.push(item)
      })
    },
    CREATE_COLUMN (state, { result, name }) {
      state.columns.push({
        doc: {
          _id: result.id,
          name,
          type: 'column'
        }
      })
    },
    CREATE_TASK (state, { result, name, columnId }) {
      state.tasks.push({
        doc: {
          _id: result.id,
          name,
          type: 'task',
          columnId,
          description: ''
        }
      })
    },
    UPDATE_TASK (state, { taskId, key, value }) {
      const taskIndex = state.tasks.findIndex(task => {
        return task.doc._id === taskId
      })
      state.tasks[taskIndex].doc[key] = value
    },
    MOVE_TASK (state, { fromTasks, fromTaskIndex, toTasks, toTaskIndex, toTaskColumnId }) {
      const taskToMove = fromTasks.splice(fromTaskIndex, 1)[0]
      taskToMove.doc.columnId = toTaskColumnId
      toTasks.splice(toTaskIndex, 0, taskToMove)
    },
    MOVE_COLUMN (state, { fromColumnIndex, toColumnIndex }) {
      const columnList = state.columns
      const columnToMove = columnList.splice(fromColumnIndex, 1)[0]
      columnList.splice(toColumnIndex, 0, columnToMove)
    }
  }
})

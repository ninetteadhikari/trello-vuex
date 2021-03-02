import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

let board = new PouchDB('board')
var remoteCouch = process.env.VUE_APP_COUCHDB_URL

// board.info((err, info) => {
//   board.changes({
//     since: info.update_seq,
//     live: true
//   }).on('change', this.fetchAllData)
//   console.log(err)
// })

export default new Vuex.Store({
  state: {
    columns: [],
    tasks: []
  },
  actions: {
    async fetchAllData ({ commit }) {
      await board.allDocs({ include_docs: true }).then(doc => {
        commit('SET_BOARD', doc.rows)
      }).catch(error => {
        console.log(error)
      })
    },
    async dbSync () {
      const opts = { live: true }
      await board.sync(remoteCouch, opts)
    },
    async addColumn ({ commit }, name) {
      const newColumn = {
        _id: uuidv4(),
        name,
        type: 'column'
      }
      await board.put(newColumn).then(result => {
        commit('CREATE_COLUMN', { result, name })
      }).catch(error => {
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
      await board.put(newTask).then(result => {
        commit('CREATE_TASK', { result, name, columnId })
      }).catch(error => {
        console.log(error)
      })
    },
    async editTask ({ commit }, { taskId, key, value }) {
      await board.get(taskId).then(doc => {
        doc[key] = value
        return board.put(doc)
      }).then(response => {
        commit('UPDATE_TASK', { taskId, key, value })
      }).catch(error => {
        console.log(error)
      })
    },
    async changeTaskColumn ({ commit }, { fromTasks, fromTaskIndex, toTasks, toTaskIndex, fromTaskId, toTaskColumnId }) {
      await board.get(fromTaskId).then(doc => {
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
    MOVE_TASK (state, { fromTasks, fromTaskIndex, toTaskIndex, toTaskColumnId }) {
      const taskToMove = fromTasks.splice(fromTaskIndex, 1)[0]
      taskToMove.doc.columnId = toTaskColumnId

      const toTasks = state.tasks.filter(
        task => toTaskColumnId === task.doc.columnId
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

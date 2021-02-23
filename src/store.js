import Vue from 'vue'
import Vuex from 'vuex'
import PouchDB from 'pouchdb-browser'
// import defaultBoard from './default-board'
import { saveStatePlugin } from './utils'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

// const board = JSON.parse(localStorage.getItem('board')) || defaultBoard

let board = new PouchDB('board')

export default new Vuex.Store({
  plugins: [saveStatePlugin],
  state: {
    board: {
      columns: []
    }
  },
  getters: {
    getTask (state) {
      return (id) => {
        for (const column of state.board.columns) {
          for (const task of column.tasks) {
            if (task.id === id) {
              return task
            }
          }
        }
      }
    }
  },
  actions: {
    fetchColumns ({ commit }) {
      board.allDocs({ include_docs: true }).then(doc => {
        commit('SET_COLUMN', doc.rows)
      }).catch(error => {
        console.log(error)
      })
    },
    addColumn ({ commit }, name) {
      const newColumn = {
        _id: new Date().toISOString(),
        name
      }

      board.put(newColumn).then(result => {
        commit('CREATE_COLUMN', name)
      }).catch(error => {
        console.log(error)
      })
    }
  },
  mutations: {
    CREATE_TASK (state, { tasks, name }) {
      tasks.push({
        name,
        id: uuidv4(),
        description: ''
      })
    },
    UPDATE_TASK (state, { task, key, value }) {
      Vue.set(task, key, value)
    },
    MOVE_TASK (state, { fromTasks, toTasks, fromTaskIndex, toTaskIndex }) {
      const taskToMove = fromTasks.splice(fromTaskIndex, 1)[0]
      toTasks.splice(toTaskIndex, 0, taskToMove)
    },
    MOVE_COLUMN (state, { fromColumnIndex, toColumnIndex }) {
      const columnList = state.board.columns
      const columnToMove = columnList.splice(fromColumnIndex, 1)[0]
      columnList.splice(toColumnIndex, 0, columnToMove)
    },
    CREATE_COLUMN (state, name) {
      state.board.columns.push({
        doc: {
          name,
          tasks: []
        }
      })
    },
    SET_COLUMN (state, columns) {
      state.board.columns = columns
    }
  }
})

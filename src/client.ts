import Undici from 'undici'
import { RequestOptions } from 'undici/types/dispatcher'
import {
    ActivityResponse,
    BehaviourResponse,
    GetActivityOptions,
    GetBehaviourOptions,
    GetHomeworkOptions,
    GetLessonsOptions,
    Homework,
    HomeworksResponse,
    LessonsResponse,
    Student,
} from '../types'
import { API_BASE, BASE_URL } from './consts'
export class ClasschartsClient {
    public studentCode = ''
    public dateOfBirth = ''
    public studentId = 0
    public studentName = ''
    private authCookies: Array<string> | undefined
    private sessionId = ''
    constructor(studentCode: unknown, dateOfBirth: unknown) {
        this.studentCode = String(studentCode)
        this.dateOfBirth = String(dateOfBirth)
    }
    private async makeAuthedRequest(
        path: string,
        options: Omit<RequestOptions, 'origin' | 'path'>
    ) {
        if (!this.authCookies) throw new Error('Not authenticated')
        const requestOptions: Omit<RequestOptions, 'origin' | 'path'> = {
            ...options,
            headers: {
                Cookie: this.authCookies.join(';'),
                authorization: 'Basic ' + this.sessionId,
            },
        }
        const request = await Undici.request(path, requestOptions)
        let responseJSON
        try {
            responseJSON = await request.body.json()
        } catch (err) {
            throw new Error('Invalid JSON response, check your dates')
        }
        if (responseJSON.success == 0) {
            throw new Error(responseJSON.error)
        }
        return responseJSON.data
    }

    async init() {
        if (!this.studentCode) throw new Error('Student Code not inputted')
        const formData = new URLSearchParams()
        formData.append('_method', 'POST')
        formData.append('code', this.studentCode.toUpperCase())
        formData.append('dob', this.dateOfBirth)
        formData.append('remember_me', '1')
        formData.append('recaptcha-token', 'no-token-avaliable')
        const request = await Undici.request(BASE_URL + '/student/login', {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if (request.statusCode != 302 || !request.headers['set-cookie'])
            throw new Error('Unauthenticated: Classcharts returned an error')
        let cookies = request.headers['set-cookie']
        for (let i = 0; i < cookies.length; i++) {
            cookies[i] = cookies[i].substring(0, cookies[i].indexOf(';'))
        }
        this.authCookies = cookies
        let sessionID: any = decodeURI(cookies[2])
            .replace(/%3A/g, ':')
            .replace(/%2C/g, ',')
        sessionID = JSON.parse(
            sessionID.substring(sessionID.indexOf('{'), sessionID.length)
        )
        this.sessionId = sessionID.session_id
        const user = await this.getStudentInfo()
        this.studentId = user.id
        this.studentName = user.name
    }

    /**
     *
     * @returns {Promise<Student>}
     */
    async getStudentInfo(): Promise<Student> {
        if (!this.authCookies) throw new Error('Not authenticated')
        const data = await this.makeAuthedRequest(API_BASE + '/ping', {
            method: 'POST',
            body: 'include_date=true',
        })
        return data?.user
    }
    async getActivity(
        options: GetActivityOptions | null
    ): Promise<ActivityResponse> {
        const params = new URLSearchParams()
        options?.from && params.append('form', options?.from)
        options?.to && params.append('to', options?.to)
        return this.makeAuthedRequest(
            API_BASE + '/activity/' + this.sessionId + '?' + params.toString(),
            {
                method: 'GET',
            }
        )
    }
    async getBehaviour(
        options: GetBehaviourOptions | null
    ): Promise<BehaviourResponse> {
        const params = new URLSearchParams()
        options?.from && params.append('form', options?.from)
        options?.to && params.append('to', options?.to)
        options?.last_id && params.append('last_id', options?.last_id)
        return await this.makeAuthedRequest(
            API_BASE + '/behaviour/' + this.studentId + '?' + params.toString(),
            {
                method: 'GET',
            }
        )
    }
    /**
     * Gets all the homework from
     * @param displayDate {DisplayDate}
     * @param fromDate
     * @param toDate
     * @returns {Promise<Array<Homework>>}
     */
    async listHomeworks(
        options: GetHomeworkOptions | null
    ): Promise<HomeworksResponse> {
        if (!this.authCookies) throw new Error('Not authenticated')
        const params = new URLSearchParams()
        params.append('display_date', String(options?.displayDate))
        options?.fromDate && params.append('from', String(options?.fromDate))
        options?.toDate && params.append('to', String(options?.toDate))
        let data: Array<Homework> = await this.makeAuthedRequest(
            API_BASE + '/homeworks/' + this.studentId + '?' + params.toString(),
            {
                method: 'GET',
            }
        )
        for (let i = 0; i < data.length; i++) {
            // homework.lesson.replace(/\\/g, '')
            data[i].description = data[i].description.replace(
                /(<([^>]+)>)/gi,
                ''
            )
            data[i].description = data[i].description.replace(/&nbsp;/g, '')
            data[i].description = data[i].description.trim()
        }
        return data
    }
    /**
     *
     * @param date
     * @returns {Promise<LessonsResponse>}
     */
    async getLessons(options: GetLessonsOptions): Promise<LessonsResponse> {
        if (!this.authCookies) throw new Error('Not authenticated')
        if (!options?.date) throw new Error('No date specified')
        const params = new URLSearchParams()
        params.append('date', String(options?.date))
        return await this.makeAuthedRequest(
            API_BASE + '/timetable/' + this.studentId + '?' + params.toString(),
            {
                method: 'GET',
            }
        )
    }
}

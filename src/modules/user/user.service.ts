import { UserEntity } from "@db/entities";
import { UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common"; // Add this import

@Injectable() // Add this decorator
export class UserService {
	constructor(private readonly userRepo: UserRepository) {}

	async findById(id: string) {
		return this.userRepo.findOne({ where: { id } });
	}

	async findByUsername(username: string) {
		return this.userRepo.findOne({ where: { username } });
	}

	async getAll() {
		return this.userRepo.find();
	}

	async create(userData: Partial<UserEntity>) {
		const user = this.userRepo.create(userData);
		return this.userRepo.save(user);
	}

	async update(id: string, updateData: Partial<UserEntity>) {
		await this.userRepo.update(id, updateData);
		return this.findById(id);
	}

	async delete(id: string) {
		return this.userRepo.delete(id);
	}
}

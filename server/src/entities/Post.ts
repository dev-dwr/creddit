import { Field, Int, ObjectType } from "type-graphql";
import { PrimaryGeneratedColumn, Column, CreateDateColumn, Entity, UpdateDateColumn,
   BaseEntity, ManyToOne, OneToMany } from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType() //exposing this entity to graphql schema by @Field() and @ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field(() => Int, {nullable:true})
  voteStatus: number | null // 1 v -1 v null

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({type:'int', default: 0})
  points!: number;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[]
  
  @Field()
  @Column()
  authorId: number
  
  //first parameter specifying type we want to be connected
  @Field()
  @ManyToOne(()=> User, user => user.posts)
  author:User

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

}